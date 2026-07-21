# Firebase permission denied — Sprint 49.20

Sprint 49.17 trở đi có thêm hai node cho luồng mời quản trị viên:

- `timeforge/adminInvitations`
- `timeforge/adminMembers`

Bản `firebase.rules.json` đi kèm ZIP luôn ở trạng thái deny-by-default vì source không biết email chủ sở hữu thật. Sau khi chép `.env.local` vào source mới, phải tạo lại và deploy Rules.

```powershell
corepack.cmd pnpm run firebase:rules:generate
corepack.cmd pnpm run firebase:rules:check
corepack.cmd pnpm dlx firebase-tools use
corepack.cmd pnpm dlx firebase-tools deploy --only database
```

Kiểm tra `firebase-tools use` phải trả về đúng Firebase project đang được dùng trong `VITE_FIREBASE_PROJECT_ID`.

Rules đã generate phải cho phép:

- Chủ sở hữu trong `VITE_OWNER_EMAIL` quản lý lời mời và thành viên.
- `owner`, `admin`, `manager` quản lý sản phẩm.
- Thành viên đã accept được kiểm tra động tại `timeforge/adminMembers/{uid}`.
- Người nhận lời mời chỉ đọc/chấp nhận lời mời có đúng email Firebase Auth của họ.

Nếu giao diện vẫn báo `permission denied`, đăng xuất rồi đăng nhập lại để Firebase cấp token mới, sau đó kiểm tra email đăng nhập có trùng hoàn toàn với `VITE_OWNER_EMAIL` hay email được mời không.
