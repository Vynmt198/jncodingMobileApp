# Đồng bộ theme Mobile App với Website (FE)

Nguồn tham chiếu: **Websitehoclaptrinhjncoding** (thư mục FE của website cùng repo/workspace).

---

## 1. Nguồn file website

| File website | Nội dung dùng để đồng bộ |
|--------------|---------------------------|
| `Websitehoclaptrinhjncoding/src/styles/theme.css` | Biến màu `:root` / `.dark`, `--radius`, typography base |
| `Websitehoclaptrinhjncoding/src/styles/fonts.css` | Font Inter |
| `Websitehoclaptrinhjncoding/src/app/components/ui/button.jsx` | Variant nút (default, outline, secondary, ghost) |
| `Websitehoclaptrinhjncoding/src/app/pages/Login.tsx`, `Register.tsx` | Layout form, input style, spacing |

---

## 2. Đã đồng bộ trên mobile

### Màu (`src/constants/colors.ts`)

- **WEBSITE_PALETTE** lấy từ `theme.css`:
  - `--background` #0a0e1a → `background`
  - `--foreground` #e4e7f1 → `textPrimary`
  - `--card` #131827 → `surface`
  - `--primary` #3b82f6 → `primary`
  - `--accent` #2563eb → `primaryDark`
  - `--secondary` #1e293b → `secondary`
  - `--muted-foreground` #94a3b8 → `textSecondary`
  - `--border` rgba(59,130,246,0.2) → `border`
  - `--ring` #3b82f6 → `borderFocus`
- Semantic: `--destructive`, `--chart-4`, `--chart-5` → `error`, `success`, `warning`.

### Typography (`src/constants/typography.ts`)

- **Font**: Website dùng Inter (ghi chú trong code; mobile mặc định System/Roboto, có thể đổi sang Inter sau khi load qua expo-font).
- **Font size**: base 16px (`--font-size`), scale sm/base/lg/xl/2xl tương ứng.
- **Heading**: h1 2xl bold, h2–h4 font-medium (500), line-height 1.5.
- **Label / button**: font-medium, text-base cho button.

### Border radius (`src/constants/spacing.ts`)

- `--radius: 0.75rem` (12px) → `BORDER_RADIUS.lg = 12`.
- `--radius-sm/md/lg/xl` → `sm: 8`, `md: 10`, `lg: 12`, `xl: 16`.

### Component

- **Button**: primary (bg primary), outline (border + hover accent), secondary, ghost — map với variant website.
- **Input**: nền `background`, viền `border`, focus `borderFocus`/ring; label `textSecondary`/foreground.

---

## 3. Cập nhật khi website đổi theme

1. Sửa `Websitehoclaptrinhjncoding/src/styles/theme.css` (`:root` / `.dark`).
2. Cập nhật **WEBSITE_PALETTE** trong `mobileapp/src/constants/colors.ts` theo biến CSS mới.
3. Nếu đổi `--radius` hoặc typography trong theme.css, chỉnh tương ứng trong `spacing.ts` và `typography.ts`.

---

## 4. Dùng font Inter trên mobile (tùy chọn)

Để giống website hơn:

1. `npx expo install expo-font @expo-google-fonts/inter`
2. Load font khi khởi động app (ví dụ trong `App.tsx`).
3. Trong `typography.ts` (hoặc theme), đổi `FONTS.regular` / `medium` / `bold` sang `'Inter'`, `'Inter-Medium'`, `'Inter-Bold'` (theo cách đặt tên của @expo-google-fonts/inter).

Sau khi đồng bộ, mobile và website dùng chung một bảng màu, kiểu chữ và bo góc.
