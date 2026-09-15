# Referral discount intent fix

When a customer explicitly opens `/ref/:code`, that action now establishes referral intent for the current session:

- capture the referral code immediately before the async Firebase settings read;
- clear any stale campaign offer kept in `sessionStorage`, so an older ad/promo link cannot silently suppress the referral discount;
- once referral settings load, refresh the attribution snapshot with the live configuration;
- if the customer later manually applies another valid promo code, normal promo precedence still applies and referral does not stack.

Expected customer test flow:
1. Open a generated referral link from Customer/Admin.
2. Add products above the configured minimum subtotal.
3. Do not enter another promo code.
4. Cart/checkout should show `Ưu đãi giới thiệu`.
5. Server validates first-order and anti-fraud rules again at order creation.
