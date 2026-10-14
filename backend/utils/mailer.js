// backend/utils/mailer.js
// Automated Email Notification Service using Nodemailer.
// Handles Welcome emails, Order confirmation emails, and Order status update emails.

const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: { user, pass },
    });
  }

  // Fallback: console logger transporter if credentials not yet configured
  return {
    sendMail: async (options) => {
      console.log('----------------------------------------------------');
      console.log('📧 [Mailer: Demo Mode - No Gmail credentials in .env]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('💡 Note: To send REAL emails directly to inboxes, add your Gmail & App Password in .env!');
      console.log('----------------------------------------------------');
      return { messageId: 'simulated_' + Date.now() };
    }
  };
}

const defaultFrom = process.env.EMAIL_FROM || '"Cosmos Fashion & Beauty" <no-reply@cosmos.com>';

// 1. Welcome Email on User Registration
async function sendWelcomeEmail({ email, name }) {
  try {
    const transporter = getTransporter();
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f3ef; margin: 0; padding: 20px; color: #222; }
        .email-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #111111 0%, #2b2b2b 100%); color: #ffffff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; color: #ffb8c6; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
        .content { padding: 35px 30px; }
        .content h2 { color: #111; margin-top: 0; font-size: 20px; }
        .content p { font-size: 15px; line-height: 1.6; color: #555; }
        .coupon-box { background: #fff8f9; border: 2px dashed #ff8da1; border-radius: 8px; padding: 18px; text-align: center; margin: 25px 0; }
        .coupon-code { font-size: 22px; font-weight: 800; color: #e83e8c; letter-spacing: 3px; }
        .cta-btn { display: inline-block; background: #111111; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: 600; font-size: 14px; margin-top: 15px; text-align: center; }
        .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="email-card">
        <div class="header">
          <h1>COSMOS</h1>
          <p>Everyday Luxury Clothes, Fashion & Beauty</p>
        </div>
        <div class="content">
          <h2>Welcome to the Cosmos family, ${name}! 🎉</h2>
          <p>We are delighted to have you with us. Your account has been registered successfully. Explore curated outfits, trendy beauty essentials, and statement jewellery designed especially for you.</p>
          
          <div class="coupon-box">
            <p style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Your Exclusive Welcome Gift</p>
            <div class="coupon-code">WELCOME20</div>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">Get 20% OFF on your very first order at checkout!</p>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:5000/shop.html" class="cta-btn">Start Shopping Now →</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Cosmos E-Commerce. All rights reserved.</p>
          <p>This is an automated email notification from your Cosmos account.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: defaultTransporterFrom(),
      to: email,
      subject: `Welcome to Cosmos, ${name}! 🎉 (20% OFF Coupon Inside)`,
      html,
    });

    console.log(`✓ Welcome email sent to ${email} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`Mailer Error (Welcome Email to ${email}):`, error.message);
  }
}

// 2. Order Confirmation Email on Purchase
async function sendOrderConfirmationEmail({ order, user }) {
  try {
    const toEmail = (user && user.email) || (order.shipping && order.shipping.phone ? `${order.shipping.phone}@demo.com` : null);
    if (!toEmail) return;

    const transporter = getTransporter();
    const customerName = (user && user.name) || (order.shipping && order.shipping.name) || 'Valued Customer';

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0;">
          <strong>${item.name}</strong>
          ${item.size ? `<br><span style="font-size: 11px; color: #8d45ff; font-weight: bold; background: #f5edff; padding: 2px 6px; border-radius: 4px;">Size: ${item.size}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹${item.price * item.qty}</td>
      </tr>
    `).join('');

    const paymentLabel = order.payment === 'cod' ? 'Cash on Delivery (COD)' : `${order.payment.toUpperCase()} (Online Payment)`;
    const paymentStatusBadge = order.paymentStatus === 'paid' 
      ? `<span style="background: #e6f9ed; color: #167a39; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">PAID</span>`
      : `<span style="background: #fff8e6; color: #9a6b00; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">PENDING (COD)</span>`;

    const txnInfo = order.transactionId 
      ? `<p style="margin: 4px 0; font-size: 13px; color: #666;"><strong>Transaction ID:</strong> <code>${order.transactionId}</code></p>`
      : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f3ef; margin: 0; padding: 20px; color: #222; }
        .email-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: #111111; color: #ffffff; padding: 25px 30px; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; color: #ffb8c6; }
        .badge-confirmed { background: #28a745; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .content { padding: 30px; }
        .order-meta { background: #fafafa; border: 1px solid #eeeeee; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
        .table-items { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        .table-items th { background: #f8f8f8; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #555; }
        .totals-final { display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #222; font-size: 18px; font-weight: bold; margin-top: 8px; color: #111; }
        .address-box { background: #fdfdfd; border-left: 3px solid #ff8da1; padding: 12px 15px; margin-top: 20px; }
        .cta-btn { display: inline-block; background: #111111; color: #ffffff !important; text-decoration: none; padding: 12px 26px; border-radius: 30px; font-weight: 600; font-size: 14px; margin-top: 20px; }
        .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="email-card">
        <div class="header">
          <table width="100%">
            <tr>
              <td><h1 style="margin:0; font-size:24px; color:#ffb8c6;">COSMOS</h1></td>
              <td align="right"><span class="badge-confirmed">✓ ORDER PLACED</span></td>
            </tr>
          </table>
        </div>
        <div class="content">
          <h2 style="margin-top:0; color:#111;">Thank you for your order, ${customerName}!</h2>
          <p style="color:#555; font-size:15px;">Your order has been placed successfully and is being prepared for shipment.</p>
          
          <div class="order-meta">
            <p style="margin: 4px 0; font-size: 14px;"><strong>Order ID:</strong> <code>${order.id}</code></p>
            <p style="margin: 4px 0; font-size: 13px; color: #666;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #666;"><strong>Payment:</strong> ${paymentLabel} &nbsp;${paymentStatusBadge}</p>
            ${txnInfo}
          </div>

          <h3 style="margin: 20px 0 10px; font-size: 16px;">Order Summary</h3>
          <table class="table-items">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
            <table width="100%" style="font-size: 14px;">
              <tr>
                <td>Subtotal</td>
                <td align="right">₹${order.subtotal}</td>
              </tr>
              <tr>
                <td>Delivery</td>
                <td align="right" style="color: #28a745; font-weight: bold;">FREE</td>
              </tr>
              <tr style="border-top: 1px solid #ddd; font-weight: bold; font-size: 16px;">
                <td style="padding-top: 8px;">Total Amount</td>
                <td align="right" style="padding-top: 8px;">₹${order.total}</td>
              </tr>
            </table>
          </div>

          <div class="address-box">
            <h4 style="margin: 0 0 6px 0; font-size: 14px;">Delivery Address</h4>
            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #444;">
              <strong>${order.shipping.name}</strong> (${order.shipping.phone})<br/>
              ${order.shipping.address}<br/>
              ${order.shipping.city} — ${order.shipping.pincode}
            </p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="http://localhost:5000/orders.html" class="cta-btn">View My Orders & Track →</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Cosmos E-Commerce. Thank you for shopping with us!</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: defaultTransporterFrom(),
      to: toEmail,
      subject: `Order Confirmed: #${order.id} (₹${order.total}) — Cosmos`,
      html,
    });

    console.log(`✓ Order confirmation email sent to ${toEmail} for Order #${order.id}`);
    return info;
  } catch (error) {
    console.error(`Mailer Error (Order Confirmation for #${order.id}):`, error.message);
  }
}

// 3. Order Status Update Email (Shipped, Delivered, Cancelled)
async function sendOrderStatusEmail({ order, user, status }) {
  try {
    const toEmail = (user && user.email) || (order.shipping && order.shipping.phone ? `${order.shipping.phone}@demo.com` : null);
    if (!toEmail) return;

    const transporter = getTransporter();
    const customerName = (user && user.name) || (order.shipping && order.shipping.name) || 'Valued Customer';

    const statusMap = {
      shipped: { title: 'Your Order is on the way! 🚚', color: '#007bff', desc: 'Your package has been dispatched with our delivery partner and will arrive soon.' },
      delivered: { title: 'Your Order has been Delivered! 📦🎉', color: '#28a745', desc: 'Your package was safely delivered to your address. We hope you love your purchase!' },
      processing: { title: 'Your Order is Processing ⚙️', color: '#17a2b8', desc: 'We are packing your items with care.' },
      cancelled: { title: 'Order Cancelled ❌', color: '#dc3545', desc: 'Your order has been cancelled as requested. Any amount paid will be refunded.' },
      return_requested: { title: 'Return Request Received 🔄', color: '#ffc107', desc: 'We have received your return request and our team is reviewing it.' },
      refunded: { title: 'Refund Completed 💰', color: '#28a745', desc: 'Your refund has been initiated back to your source account.' },
    };

    const currentStatus = statusMap[status] || { title: `Order Status: ${status.toUpperCase()}`, color: '#333333', desc: `Your order status has been updated to ${status}.` };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f3ef; margin: 0; padding: 20px; color: #222; }
        .email-card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: #111111; color: #ffffff; padding: 25px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; color: #ffb8c6; }
        .content { padding: 30px; text-align: center; }
        .status-badge { display: inline-block; background: ${currentStatus.color}; color: #ffffff; padding: 8px 18px; border-radius: 25px; font-weight: bold; font-size: 14px; margin: 15px 0; text-transform: uppercase; }
        .cta-btn { display: inline-block; background: #111111; color: #ffffff !important; text-decoration: none; padding: 12px 26px; border-radius: 30px; font-weight: 600; font-size: 14px; margin-top: 20px; }
        .footer { background: #fafafa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="email-card">
        <div class="header">
          <h1>COSMOS</h1>
        </div>
        <div class="content">
          <div class="status-badge">${status}</div>
          <h2 style="color:#111; margin: 10px 0;">${currentStatus.title}</h2>
          <p style="color:#555; font-size: 15px; max-width: 460px; margin: 0 auto 20px;">
            Hello ${customerName}, ${currentStatus.desc}
          </p>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: left; max-width: 400px; margin: 0 auto;">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Order ID:</strong> <code>${order.id}</code></p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Total:</strong> ₹${order.total}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Deliver to:</strong> ${order.shipping.city}, ${order.shipping.pincode}</p>
          </div>

          <div>
            <a href="http://localhost:5000/orders.html" class="cta-btn">Track Order Live →</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Cosmos E-Commerce. Need help? Contact support@cosmos.com</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: defaultTransporterFrom(),
      to: toEmail,
      subject: `Order #${order.id} Update: ${status.toUpperCase()} — Cosmos`,
      html,
    });

    console.log(`✓ Order status email (${status}) sent to ${toEmail}`);
    return info;
  } catch (error) {
    console.error(`Mailer Error (Status Email for #${order.id}):`, error.message);
  }
}

// 4. OTP Verification Email (Registration & Forgot Password)
async function sendOtpEmail({ email, name, otp, purpose }) {
  try {
    const transporter = getTransporter();
    const isRegister = purpose === 'register';
    const title = isRegister ? 'Verify Your Cosmos Account' : 'Reset Your Password';
    const actionDesc = isRegister
      ? 'Thank you for signing up with Cosmos! Please use the 6-digit verification code below to complete your registration.'
      : 'We received a request to reset your Cosmos account password. Use the 6-digit code below to set your new password.';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f3ef; margin: 0; padding: 20px; color: #222; }
        .email-card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
        .header { background: #111111; color: #ffffff; padding: 24px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; color: #ffb8c6; }
        .content { padding: 35px 30px; text-align: center; }
        .content h2 { margin-top: 0; font-size: 20px; color: #111; }
        .content p { font-size: 14px; line-height: 1.6; color: #555; }
        .otp-box { background: #fff5f7; border: 2px dashed #ff8da1; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 20px 0; }
        .otp-digits { font-size: 34px; font-weight: 800; color: #db2777; letter-spacing: 8px; font-family: monospace; }
        .warning-text { font-size: 12px; color: #888; margin-top: 15px; }
        .footer { background: #fafafa; padding: 18px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eeeeee; }
      </style>
    </head>
    <body>
      <div class="email-card">
        <div class="header">
          <h1>COSMOS</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Hello ${name || 'User'},</p>
          <p>${actionDesc}</p>
          
          <div class="otp-box">
            <span class="otp-digits">${otp}</span>
          </div>

          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #e11d48;">
            ⏱ This code is valid for 10 minutes.
          </p>
          <p class="warning-text">
            If you did not request this verification code, please ignore this email. Do not share this OTP with anyone.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Cosmos E-Commerce. Sent securely from ${process.env.EMAIL_USER || 'support@cosmos.com'}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: defaultTransporterFrom(),
      to: email,
      subject: `${otp} is your Cosmos ${isRegister ? 'Verification' : 'Password Reset'} Code`,
      html,
    });

    console.log(`✓ OTP email (${purpose}) sent to ${email} (Code: ${otp})`);
    return info;
  } catch (error) {
    console.error(`Mailer Error (OTP Email to ${email}):`, error.message);
  }
}

function defaultTransporterFrom() {
  return process.env.EMAIL_USER ? `"Cosmos Fashion" <${process.env.EMAIL_USER}>` : defaultFrom;
}

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendOtpEmail,
};

