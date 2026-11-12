const crypto = require('node:crypto');
const products = require('../data/products.json');
const coupons = require('../data/coupons.json');
const shippingConfig = require('../data/shipping.json');
const { isSameOrigin } = require('../lib/admin-auth');

function cleanText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ error: 'طلب غير مسموح' });

  try {
    const input = req.body || {};
    const customerInput = input.customer || {};
    const customer = {
      name: cleanText(customerInput.name, 100),
      phone: cleanText(customerInput.phone, 20).replace(/\D/g, ''),
      governorate: cleanText(customerInput.governorate, 80),
      center: cleanText(customerInput.center, 80),
      address: cleanText(customerInput.address, 400),
      notes: cleanText(customerInput.notes, 250),
    };
    if (!customer.name || !/^01\d{9}$/.test(customer.phone) || !customer.governorate || !customer.center || !customer.address) {
      return res.status(400).json({ error: 'راجع بيانات التوصيل وحاول مرة أخرى' });
    }
    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 20) {
      return res.status(400).json({ error: 'السلة غير صالحة. احذف المنتجات وأضفها مرة أخرى.' });
    }

    let subtotal = 0;
    const items = [];
    for (const requested of input.items) {
      const product = products.find(item => item.id === String(requested.productId || ''));
      const qty = Number(requested.qty);
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return res.status(400).json({ error: 'أحد المنتجات لم يعد متاحاً. حدّث السلة وحاول مرة أخرى.' });
      }
      const size = cleanText(requested.size, 12);
      const color = cleanText(requested.color, 32);
      const material = cleanText(requested.material, 32);
      if ((size && Array.isArray(product.sizes) && !product.sizes.includes(size)) ||
          (color && Array.isArray(product.colors) && !product.colors.some(value => value.name === color)) ||
          (material && Array.isArray(product.materials) && !product.materials.includes(material))) {
        return res.status(400).json({ error: 'اختيار أحد المنتجات لم يعد متاحاً. حدّث السلة.' });
      }
      subtotal += Number(product.price) * qty;
      const options = [size, color, material].filter(Boolean).join(' / ');
      items.push({
        productId: product.id,
        name: options ? `${product.name} (${options})` : product.name,
        price: Number(product.price),
        qty,
        image: product.image,
      });
    }

    const governorate = shippingConfig.governorates[customer.governorate];
    if (!governorate) return res.status(400).json({ error: 'المحافظة غير مدعومة' });
    const shippingPrice = governorate.centers && governorate.centers[customer.center];
    if (!Number.isFinite(Number(shippingPrice))) return res.status(400).json({ error: 'المدينة غير مدعومة' });

    let discount = 0;
    let shipping = Number(shippingPrice);
    let couponLabel = null;
    const code = cleanText(input.couponCode, 32).toUpperCase();
    if (code) {
      const coupon = coupons.find(value => value.code === code && value.active !== false);
      if (!coupon) return res.status(400).json({ error: 'كود الخصم غير صالح حالياً' });
      couponLabel = coupon.label || coupon.code;
      if (coupon.type === 'percent') discount = Math.min(subtotal, Math.max(0, Math.round(subtotal * Number(coupon.value) / 100)));
      else if (coupon.type === 'fixed') discount = Math.min(Number(coupon.value), subtotal);
      else if (coupon.type === 'shipping') shipping = 0;
    }
    if (subtotal >= Number(shippingConfig.freeShippingMin || 0) && !(code && coupons.find(c => c.code === code)?.type === 'shipping')) shipping = 0;

    const id = `ATH-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const order = {
      id,
      items,
      subtotal,
      shipping,
      discount,
      coupon: couponLabel,
      total: Math.max(0, subtotal - discount) + shipping,
      customer,
      status: 'pending',
      date,
      dates: [date, '', '', ''],
      createdAt: Date.now(),
    };

    const { put } = await import('@vercel/blob');
    await put(`orders/${id}.json`, JSON.stringify(order), {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return res.status(201).json({ success: true, orderId: id, total: order.total });
  } catch (error) {
    return res.status(500).json({ error: 'تعذر حفظ الطلب. حاول مرة أخرى أو تواصل معنا.' });
  }
};
