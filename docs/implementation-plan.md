Dựa trên câu trả lời của bạn — người mới hoàn toàn, muốn build P2P payments để demo — đây là plan phù hợp nhất.

**Tại sao P2P USDC Transfer là lựa chọn tốt nhất cho người mới?**

- Không cần smart contract phức tạp — chỉ gọi hàm `transfer` có sẵn trên USDC
- Thấy ngay kết quả: gửi tiền, xem transaction trên explorer
- Hiểu được 3 khái niệm cốt lõi: ví, gas, stablecoin
- Arc dùng USDC làm gas luôn — không cần ETH hay token khác

---

## Implementation Plan: USDC P2P Transfer App

### Summary
App cho phép người dùng kết nối ví và gửi USDC đến bất kỳ địa chỉ nào trên Arc Testnet. Đơn giản, trực quan, phù hợp để demo và học blockchain từ đầu.

### Architecture
- **Blockchain:** Arc Testnet — USDC là gas token, phí thấp, xác nhận nhanh dưới 1 giây
- **Contract:** Không cần contract mới — dùng USDC contract có sẵn trên Arc Testnet (ERC-20 `transfer`)
- **Frontend:** React + Tailwind, form nhập địa chỉ và số tiền, hiển thị số dư, lịch sử giao dịch
- **Wallet:** ConnectKit (MetaMask, WalletConnect)

### Files to Create/Modify
1. `src/config.ts` — cấu hình Arc Testnet chain + địa chỉ USDC contract
2. `src/components/WalletBar.tsx` — hiển thị địa chỉ ví + số dư USDC
3. `src/components/SendForm.tsx` — form nhập địa chỉ nhận + số tiền USDC
4. `src/components/TxStatus.tsx` — trạng thái giao dịch (pending / success / error) + link explorer
5. `src/App.tsx` — ghép các component, layout chính

### Build Sequence
1. Cấu hình Arc Testnet và USDC contract address trong `src/config.ts`
2. Wiring wagmi + ConnectKit cho wallet connection
3. Build `WalletBar` — đọc số dư USDC từ contract
4. Build `SendForm` — validate input, gọi USDC `transfer`
5. Build `TxStatus` — theo dõi trạng thái tx, hiện link Arc Explorer
6. Ghép vào `App.tsx`, polish UI với Tailwind

### Done When
- [ ] Người dùng kết nối MetaMask thành công
- [ ] Số dư USDC hiển thị đúng
- [ ] Gửi USDC đến địa chỉ khác thành công trên Arc Testnet
- [ ] Transaction hash hiển thị với link đến Arc Explorer
- [ ] App chạy ổn định, không có lỗi console

---

## Ready to build?

Nhấn **Approve Plan** để bắt đầu build, hoặc cho tôi biết nếu muốn điều chỉnh gì (ví dụ: thêm lịch sử giao dịch, QR code, hay đổi giao diện). Plan đã được lưu vào `arc-studio-plans/PLAN.md`. Approve để build ngay hoặc nói cho tôi biết nếu muốn thay đổi gì!
