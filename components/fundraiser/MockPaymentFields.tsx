'use client';
/**
 * MockPaymentFields — card / expiry / CVC / name / email inputs.
 * No real Stripe. Extracted to keep DonationCard under 300 lines.
 * Fires no analytics events itself (Donate Started/Completed/Failed owned by DonationCard).
 */

import React, { useState, useId } from 'react';

export function MockPaymentFields() {
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const emailId = useId();
  const cardId = useId();

  const inputCls =
    'w-full px-3 py-2 rounded-[var(--hrt-size-radius-md)] border border-[var(--hrt-color-button-secondary-border)] text-body-md bg-white focus:outline-2 focus:outline-[var(--hrt-color-border-brand)]';

  return (
    <div className="flex flex-col gap-[var(--hrt-size-spacing-1)] mb-[var(--hrt-size-spacing-2)]">
      <label htmlFor={cardId} className="sr-only">Card number</label>
      <input id={cardId} type="text" placeholder="Card number" value={cardNum}
        onChange={(e) => setCardNum(e.target.value)} maxLength={19}
        className={inputCls} aria-label="Card number" inputMode="numeric" />

      <div className="flex gap-[var(--hrt-size-spacing-1)]">
        <input type="text" placeholder="MM/YY" value={expiry}
          onChange={(e) => setExpiry(e.target.value)} maxLength={5}
          className={`flex-1 ${inputCls}`} aria-label="Expiry date" />
        <input type="text" placeholder="CVC" value={cvc}
          onChange={(e) => setCvc(e.target.value)} maxLength={4}
          className={`flex-1 ${inputCls}`} aria-label="Security code" />
      </div>

      <input type="text" placeholder="Name on card" value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputCls} aria-label="Name on card" />

      <label htmlFor={emailId} className="sr-only">Email address</label>
      <input id={emailId} type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputCls} aria-label="Email address" />
    </div>
  );
}
