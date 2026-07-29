import {
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { toast as sonnerToast } from "sonner";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BadgePercent,
  BarChart3,
  Bell,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CircleUserRound,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  Globe2,
  GripVertical,
  History,
  Home,
  ImagePlus,
  Laptop,
  LayoutTemplate,
  ListFilter,
  Mail,
  MapPin,
  Menu,
  Monitor,
  MoreHorizontal,
  PackageCheck,
  PackageSearch,
  Phone,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Tags,
  Trash2,
  Undo2,
  UploadCloud,
  UserRoundSearch,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useCommerce } from "./context";
import { useAuth } from "./auth";
import { DEFAULT_STORE_LOGO, resolveStoreName } from "./store-profile";
import type {
  BlockType,
  Collection,
  Condition,
  Customer,
  ImportResult,
  Metafield,
  Product,
  ProductOption,
  Section,
  SectionType,
  TemplateKey,
  Theme,
  ThemeBlock,
  Variant,
  StoreProfile,
} from "./types";
import { download, exportShopifyCsv, parseShopifyCsv } from "./csv";
import { money, slugify, strip, uid } from "./utils";
import {
  allowedBlocks,
  allowedSections,
  blockLabels,
  createSection,
  sectionLabels,
  templateLabels,
} from "./theme";
import { ThemePreviewCanvas } from "./theme-renderer";
import {
  collectionConditionNeedsValue,
  resolvesCollectionProducts,
} from "./collection-utils";
import { AdminCommandPalette } from "./admin-v9";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui";
import {cloudinaryUploadConfigured, uploadCloudinaryImage} from "./cloudinary-upload";
import "./v4926-admin.css";
import "./v513-store-profile.css";
const Btn = ({
  variant = "primary",
  className = "",
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) => <button {...p} className={`btn ${variant} ${className}`} />;
const Input = (p: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} className={`input ${p.className || ""}`} />
);
const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={`input textarea ${p.className || ""}`} />
);
const Select = ({
  children,
  ...p
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={`input select ${p.className || ""}`}>
    {children}
  </select>
);
const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);
const Badge = ({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "neutral" | "danger";
}) => <span className={`badge ${tone}`}>{children}</span>;
type ToastTone = "success" | "danger" | "info";
type ToastPayload = { message: string; tone?: ToastTone };
const emitToast = (message: string, tone: ToastTone = "success") =>
  window.dispatchEvent(
    new CustomEvent<ToastPayload>("timeforge:toast", {
      detail: { message, tone },
    }),
  );
function AdminToastHost() {
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (detail.tone === "danger") sonnerToast.error(detail.message);
      else if (detail.tone === "info") sonnerToast.info(detail.message);
      else sonnerToast.success(detail.message);
    };
    window.addEventListener("timeforge:toast", onToast);
    return () => window.removeEventListener("timeforge:toast", onToast);
  }, []);
  return null;
}
function CdnImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  return (
    <Field label={label} hint="Dán URL ảnh HTTPS từ CDN của cửa hàng.">
      <div className="cdn-image-field">
        {value && (
          <img
            src={value}
            alt="Xem trước ảnh CDN"
            loading="lazy"
            decoding="async"
          />
        )}
        <Input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value.trimStart())}
          placeholder="https://cdn.example.com/image.webp"
        />
      </div>
    </Field>
  );
}

const nav = [
  ["/admin", "Trang chủ", Home],
  ["/admin/orders", "Đơn hàng", ShoppingBag],
  ["/admin/returns", "Hoàn trả", RotateCcw],
  ["/admin/draft-orders", "Đơn hàng nháp", FileText],
  ["/admin/products", "Sản phẩm", Boxes],
  ["/admin/collections", "Bộ sưu tập", Tags],
  ["/admin/inventory", "Hàng tồn kho", PackageSearch],
  ["/admin/customers", "Khách hàng", Users],
  ["/admin/customer-segments", "Phân khúc khách hàng", UserRoundSearch],
  ["/admin/analytics", "Phân tích", BarChart3],
  ["/admin/discounts", "Mã giảm giá", BadgePercent],
  ["/admin/activity", "Hoạt động", Activity],
  ["/admin/import-export", "Nhập / xuất", FileUp],
] as const;
export function AdminLayout() {
  const [open, setOpen] = useState(false),
    loc = useLocation();
  const { dataSource } = useCommerce();
  const { user, logout } = useAuth();
  const liveData = dataSource === "firebase",
    dataLabel =
      dataSource === "loading"
        ? "Đang tải Firebase"
        : liveData
          ? "Firebase live"
          : dataSource === "error"
            ? "Lỗi tải catalog"
            : dataSource === "seed"
              ? "Dữ liệu mẫu"
              : "Dữ liệu local";
  const title = loc.pathname.startsWith("/admin/products/")
    ? "Chỉnh sửa sản phẩm"
    : loc.pathname.startsWith("/admin/draft-orders/")
      ? "Chỉnh sửa đơn nháp"
      : loc.pathname.startsWith("/admin/orders/")
        ? "Chi tiết đơn hàng"
        : (
            {
              "/admin": "Trang chủ",
              "/admin/draft-orders": "Đơn hàng nháp",
              "/admin/returns": "Hoàn trả",
              "/admin/products": "Sản phẩm",
              "/admin/collections": "Bộ sưu tập",
              "/admin/customers": "Khách hàng",
              "/admin/customer-segments": "Phân khúc khách hàng",
              "/admin/import-export": "Nhập / xuất dữ liệu",
              "/admin/online-store": "Cửa hàng online",
              "/admin/settings": "Cài đặt",
              "/admin/settings/integrations": "Thanh toán & giao hàng",
              "/admin/inventory": "Hàng tồn kho",
              "/admin/orders": "Đơn hàng",
              "/admin/analytics": "Phân tích",
              "/admin/discounts": "Mã giảm giá",
              "/admin/activity": "Nhật ký hoạt động",
            } as Record<string, string>
          )[loc.pathname] || "TimeForge Admin";
  return (
    <div className="admin-app">
      {open && (
        <button className="side-backdrop" onClick={() => setOpen(false)} />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-logo">
          <Link to="/admin">
            <span className="shop-mark">TF</span>
            <span className="shop-name">
              TimeForge<small>Commerce</small>
            </span>
          </Link>
          <button onClick={() => setOpen(false)} aria-label="Đóng menu">
            <X />
          </button>
        </div>
        <div className="store-switcher">
          <span>TF</span>
          <div>
            <b>TimeForge</b>
            <small>Cửa hàng chính</small>
          </div>
          <ChevronDown />
        </div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              onClick={() => setOpen(false)}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="side-group">
            <p>Kênh bán hàng</p>
            <NavLink to="/admin/online-store" onClick={() => setOpen(false)}>
              <LayoutTemplate />
              <span>Cửa hàng online</span>
              <ChevronDown />
            </NavLink>
          </div>
        </nav>
        <div className="side-settings-stack">
          <NavLink className="side-settings" to="/admin/settings/integrations">
            <Wrench />
            Tích hợp
          </NavLink>
          <NavLink className="side-settings" to="/admin/settings">
            <Settings />
            Cài đặt
          </NavLink>
        </div>
      </aside>
      <div className="admin-main">
        <header className="topbar">
          <button
            className="top-menu"
            onClick={() => setOpen(true)}
            aria-label="Mở menu"
          >
            <Menu />
          </button>
          <button
            className="admin-search admin-search-button"
            onClick={() =>
              window.dispatchEvent(new Event("timeforge:open-command"))
            }
          >
            <Search />
            <span>Tìm kiếm</span>
            <kbd>Ctrl K</kbd>
          </button>
          <div className="top-right">
            <span className={`firebase-state ${liveData ? "live" : ""}`}>
              {dataLabel}
            </span>
            <Link className="view-store" to="/" target="_blank">
              Xem cửa hàng
            </Link>
            <button className="top-icon" aria-label="Thông báo">
              <Bell />
            </button>
            <span className="admin-user">
              <span className="avatar">
                {(user?.name || "A").slice(0, 1).toUpperCase()}
              </span>
              <span>
                <b>{user?.name}</b>
                <small>{user?.role}</small>
              </span>
            </span>
            <button className="admin-logout" onClick={() => void logout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        <div className="admin-head">
          <div>
            <small>TimeForge</small>
            <h1>{title}</h1>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
      <AdminToastHost />
      <AdminCommandPalette />
    </div>
  );
}
export function Dashboard() {
  const { products, customers, collections, themeState } = useCommerce(),
    inventory = products.reduce((s, p) => s + p.inventory, 0),
    value = products.reduce((s, p) => s + p.price * p.inventory, 0);
  return (
    <div>
      <section className="welcome">
        <div>
          <small>
            Theme đã xuất bản{" "}
            {new Date(themeState.publishedAt).toLocaleDateString("vi-VN")}
          </small>
          <h2>Quản lý TimeForge trong một nơi.</h2>
          <p>
            Sprint 2 bổ sung theme đa template, draft/publish và editor sản phẩm
            nâng cao.
          </p>
        </div>
        <Link to="/admin/products/new">
          Thêm sản phẩm
          <ArrowUpRight />
        </Link>
      </section>
      <section className="metrics">
        <Metric
          icon={<Boxes />}
          label="Sản phẩm"
          value={String(products.length)}
          note={`${products.filter((p) => p.status === "active").length} đang hoạt động`}
        />
        <Metric
          icon={<PackageCheck />}
          label="Tồn kho"
          value={String(inventory)}
          note={`${products.filter((p) => p.inventory <= 3).length} sắp hết`}
        />
        <Metric
          icon={<Users />}
          label="Khách hàng"
          value={String(customers.length)}
          note="Hồ sơ đã lưu"
        />
        <Metric
          icon={<CircleDollarSign />}
          label="Giá trị hàng"
          value={money(value)}
          note="Theo giá bán"
        />
      </section>
      <section className="admin-two">
        <article className="card">
          <CardHead
            small="Hoạt động"
            title="Sản phẩm mới cập nhật"
            link="/admin/products"
          />
          <div className="recent-products">
            {products.slice(0, 5).map((p) => (
              <Link to={`/admin/products/${p.id}`} key={p.id}>
                <img src={p.images[0]} alt="" />
                <div>
                  <b>{p.title}</b>
                  <span>
                    {p.vendor} · {p.sku || "Chưa SKU"}
                  </span>
                </div>
                <Badge tone={p.status === "active" ? "success" : "warning"}>
                  {p.status}
                </Badge>
              </Link>
            ))}
          </div>
        </article>
        <article className="card">
          <CardHead small="Online Store" title="Theme đang xuất bản" />
          <div className="summary-list">
            <div>
              <span>Tên theme</span>
              <b>{themeState.published.name}</b>
            </div>
            <div>
              <span>Templates</span>
              <b>{Object.keys(themeState.published.templates).length}</b>
            </div>
            <div>
              <span>Phiên bản lưu</span>
              <b>{themeState.versions.length}</b>
            </div>
            <div>
              <span>Bộ sưu tập</span>
              <b>{collections.length}</b>
            </div>
          </div>
          <Link className="card-link" to="/admin/online-store">
            Tùy chỉnh theme
            <ArrowUpRight />
          </Link>
        </article>
      </section>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <b>{value}</b>
        <p>{note}</p>
      </div>
    </article>
  );
}
function CardHead({
  small,
  title,
  link,
}: {
  small: string;
  title: string;
  link?: string;
}) {
  return (
    <header className="card-head">
      <div>
        <small>{small}</small>
        <h3>{title}</h3>
      </div>
      {link && <Link to={link}>Xem tất cả</Link>}
    </header>
  );
}
export function Products() {
  const { products, deleteProducts } = useCommerce();
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("all"),
    [selected, setSelected] = useState<string[]>([]);
  const shown = products.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        `${p.title} ${p.vendor} ${p.sku}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    ),
    all = shown.length > 0 && shown.every((p) => selected.includes(p.id));
  return (
    <div className="stack">
      <div className="admin-actions">
        <div>
          <Link className="btn secondary" to="/admin/import-export">
            <FileUp />
            Nhập
          </Link>
          <Link className="btn secondary" to="/admin/import-export">
            <Download />
            Xuất
          </Link>
        </div>
        <Link className="btn primary" to="/admin/products/new">
          <Plus />
          Thêm sản phẩm
        </Link>
      </div>
      <section className="card product-card-admin">
        <div className="tabs">
          {[
            ["all", "Tất cả"],
            ["active", "Đang hoạt động"],
            ["draft", "Bản nháp"],
            ["archived", "Lưu trữ"],
          ].map(([v, l]) => (
            <button
              className={status === v ? "active" : ""}
              key={v}
              onClick={() => setStatus(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="table-tools">
          <div>
            <Search />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tên, SKU hoặc thương hiệu"
            />
          </div>
          {selected.length > 0 && (
            <Btn
              variant="danger"
              onClick={() => {
                deleteProducts(selected);
                setSelected([]);
              }}
            >
              <Trash2 />
              Xóa {selected.length}
            </Btn>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={all}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? shown.map((p) => p.id) : [],
                      )
                    }
                  />
                </th>
                <th>Sản phẩm</th>
                <th>Trạng thái</th>
                <th>Tồn kho</th>
                <th>Loại</th>
                <th>Thương hiệu</th>
                <th>Giá</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, p.id]
                            : selected.filter((id) => id !== p.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <Link
                      className="product-cell"
                      to={`/admin/products/${p.id}`}
                    >
                      <img src={p.images[0]} alt="" />
                      <div>
                        <b>{p.title}</b>
                        <span>{p.sku || "Chưa SKU"}</span>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <Badge
                      tone={
                        p.status === "active"
                          ? "success"
                          : p.status === "draft"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td>{p.inventory} trong kho</td>
                  <td>{p.productType || "—"}</td>
                  <td>{p.vendor || "—"}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <button className="icon-btn">
                      <MoreHorizontal />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const collectionFieldOptions: { value: Condition["field"]; label: string }[] = [
  { value: "vendor", label: "Nhà cung cấp (Vendor)" },
  { value: "productType", label: "Loại sản phẩm" },
  { value: "tag", label: "Thẻ sản phẩm (Tags)" },
  { value: "gender", label: "Giới tính" },
  { value: "status", label: "Trạng thái" },
  { value: "price", label: "Giá bán" },
  { value: "compareAtPrice", label: "Giá gốc / giá so sánh" },
  { value: "inventory", label: "Số lượng tồn" },
  { value: "discountPercent", label: "Phần trăm giảm giá" },
];
const numericCollectionFields = new Set<Condition["field"]>([
  "price",
  "compareAtPrice",
  "inventory",
  "discountPercent",
]);
const collectionOperatorOptions = (
  field: Condition["field"],
): { value: Condition["operator"]; label: string }[] => {
  if (numericCollectionFields.has(field))
    return [
      { value: "equals", label: "Bằng" },
      { value: "not_equals", label: "Không bằng" },
      { value: "greater_than", label: "Lớn hơn" },
      { value: "greater_or_equal", label: "Lớn hơn hoặc bằng" },
      { value: "less_than", label: "Nhỏ hơn" },
      { value: "less_or_equal", label: "Nhỏ hơn hoặc bằng" },
      ...(field === "compareAtPrice"
        ? [
            { value: "is_set" as const, label: "Có giá trị" },
            { value: "is_not_set" as const, label: "Không có giá trị" },
          ]
        : []),
    ];
  if (field === "gender" || field === "status")
    return [
      { value: "equals", label: "Bằng" },
      { value: "not_equals", label: "Không bằng" },
    ];
  return [
    { value: "equals", label: "Bằng" },
    { value: "not_equals", label: "Không bằng" },
    { value: "contains", label: "Có chứa" },
    { value: "not_contains", label: "Không chứa" },
    { value: "is_set", label: "Có giá trị" },
    { value: "is_not_set", label: "Không có giá trị" },
  ];
};
const blankCollectionCondition = (): Condition => ({
  field: "vendor",
  operator: "equals",
  value: "",
});

export function Collections() {
  const { collections, products, saveCollection, deleteCollection } =
    useCommerce();
  const [editing, setEditing] = useState<Collection | null>(null),
    [productQuery, setProductQuery] = useState("");
  const blank = (): Collection => ({
    id: uid("c"),
    handle: "",
    title: "",
    description: "",
    type: "manual",
    status: "draft",
    image: "",
    productIds: [],
    conditions: [],
    conditionMatch: "all",
  });
  const picked = editing?.productIds.length || 0;
  const productMatches = products.filter((p) =>
    `${p.title} ${p.vendor} ${p.sku}`
      .toLowerCase()
      .includes(productQuery.toLowerCase()),
  );
  const shownProducts = productMatches.slice(0, 80);
  const vendors = useMemo(
    () =>
      [
        ...new Set(products.map((product) => product.vendor).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b, "vi")),
    [products],
  );
  const productTypes = useMemo(
    () =>
      [
        ...new Set(
          products.map((product) => product.productType).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "vi")),
    [products],
  );
  const tags = useMemo(
    () =>
      [...new Set(products.flatMap((product) => product.tags))].sort((a, b) =>
        a.localeCompare(b, "vi"),
      ),
    [products],
  );
  const collectionCounts = useMemo(
    () =>
      new Map(
        collections.map((collection) => [
          collection.id,
          resolvesCollectionProducts(collection, products).length,
        ]),
      ),
    [collections, products],
  );
  const automaticMatches = useMemo(
    () =>
      editing?.type === "automatic"
        ? resolvesCollectionProducts(editing, products)
        : [],
    [editing, products],
  );
  const shownAutomaticMatches = automaticMatches
    .filter((product) =>
      `${product.title} ${product.vendor} ${product.sku}`
        .toLowerCase()
        .includes(productQuery.toLowerCase()),
    )
    .slice(0, 12);
  const automaticValid =
    editing?.type !== "automatic" ||
    ((editing.conditions?.length || 0) > 0 &&
      (editing.conditions || []).every(
        (condition) =>
          !collectionConditionNeedsValue(condition) || condition.value.trim(),
      ));
  const startEdit = (collection: Collection) => {
    setProductQuery("");
    setEditing({
      ...structuredClone(collection),
      productIds: collection.productIds || [],
      conditions: collection.conditions || [],
      conditionMatch: collection.conditionMatch || "all",
    });
  };
  const patchCondition = (index: number, patch: Partial<Condition>) =>
    setEditing((current) =>
      current
        ? {
            ...current,
            conditions: (current.conditions || []).map(
              (condition, conditionIndex) =>
                conditionIndex === index
                  ? { ...condition, ...patch }
                  : condition,
            ),
          }
        : current,
    );
  const changeConditionField = (index: number, field: Condition["field"]) =>
    patchCondition(index, {
      field,
      operator:
        field === "compareAtPrice"
          ? "is_set"
          : numericCollectionFields.has(field)
            ? "greater_than"
            : "equals",
      value: "",
    });
  const addPreset = (condition: Condition) =>
    setEditing((current) =>
      current
        ? {
            ...current,
            type: "automatic",
            conditions: [...(current.conditions || []), condition],
            conditionMatch: current.conditionMatch || "all",
          }
        : current,
    );
  const renderConditionValue = (condition: Condition, index: number) => {
    if (!collectionConditionNeedsValue(condition))
      return (
        <span className="tf508-condition-empty-value">
          Không cần nhập giá trị
        </span>
      );
    if (condition.field === "gender")
      return (
        <Select
          aria-label="Giá trị giới tính"
          value={condition.value}
          onChange={(event) =>
            patchCondition(index, { value: event.target.value })
          }
        >
          <option value="">Chọn giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Unisex">Unisex</option>
        </Select>
      );
    if (condition.field === "status")
      return (
        <Select
          aria-label="Giá trị trạng thái"
          value={condition.value}
          onChange={(event) =>
            patchCondition(index, { value: event.target.value })
          }
        >
          <option value="">Chọn trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="draft">Bản nháp</option>
          <option value="archived">Lưu trữ</option>
        </Select>
      );
    const list =
      condition.field === "vendor"
        ? "tf508-vendors"
        : condition.field === "tag"
          ? "tf508-tags"
          : condition.field === "productType"
            ? "tf508-product-types"
            : undefined;
    const suffix =
      condition.field === "discountPercent"
        ? "%"
        : condition.field === "inventory"
          ? "sản phẩm"
          : condition.field === "price" || condition.field === "compareAtPrice"
            ? "₫"
            : "";
    return (
      <div className="tf508-condition-input">
        <Input
          aria-label="Giá trị điều kiện"
          type={
            numericCollectionFields.has(condition.field) ? "number" : "text"
          }
          min={numericCollectionFields.has(condition.field) ? 0 : undefined}
          step={
            condition.field === "price" || condition.field === "compareAtPrice"
              ? 1000
              : 1
          }
          list={list}
          value={condition.value}
          onChange={(event) =>
            patchCondition(index, { value: event.target.value })
          }
          placeholder={
            condition.field === "tag"
              ? "Ví dụ: Best seller"
              : condition.field === "vendor"
                ? "Chọn hoặc nhập vendor"
                : condition.field === "discountPercent"
                  ? "Ví dụ: 20"
                  : "Nhập giá trị"
          }
        />
        {suffix && <span>{suffix}</span>}
      </div>
    );
  };
  return (
    <div className="tf4917-catalog-page tf4917-collections-page">
      <section className="tf4917-catalog-toolbar tf4917-collection-toolbar">
        <div className="tf4917-catalog-toolbar-copy">
          <span>BỘ SƯU TẬP</span>
          <b>Tổ chức catalog theo điều kiện linh hoạt</b>
          <small>
            {collections.length} bộ sưu tập · tạo thủ công hoặc tự động theo
            giá, tồn kho, vendor, tags và metafield.
          </small>
        </div>
        <div className="tf4917-catalog-actions">
          <button
            className="tf4917-action primary"
            onClick={() => {
              setProductQuery("");
              setEditing(blank());
            }}
          >
            <Plus />
            Tạo bộ sưu tập
          </button>
        </div>
      </section>
      {collections.length ? (
        <div className="tf4917-collection-grid">
          {collections.map((c) => (
            <article className="tf4917-collection-card" key={c.id}>
              <div className="collection-card-media">
                {c.image ? (
                  <img src={c.image} alt={c.title} />
                ) : (
                  <div className="collection-placeholder">
                    <ImagePlus />
                    <span>Chưa có ảnh</span>
                  </div>
                )}
                <Badge tone={c.status === "active" ? "success" : "warning"}>
                  {c.status === "active" ? "Hoạt động" : "Bản nháp"}
                </Badge>
              </div>
              <div className="collection-card-body">
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.description || "Chưa có mô tả cho bộ sưu tập này."}</p>
                </div>
                <div className="collection-card-meta">
                  <span>
                    {c.type === "manual"
                      ? "Thủ công"
                      : `Tự động · ${c.conditionMatch === "any" ? "bất kỳ" : "tất cả"}`}
                  </span>
                  <b>{collectionCounts.get(c.id) || 0} sản phẩm</b>
                </div>
                <footer>
                  <Btn variant="secondary" onClick={() => startEdit(c)}>
                    Chỉnh sửa
                  </Btn>
                  <button
                    className="danger-icon"
                    aria-label="Xóa bộ sưu tập"
                    onClick={() => {
                      deleteCollection(c.id);
                      emitToast("Đã xóa bộ sưu tập.", "info");
                    }}
                  >
                    <Trash2 />
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="tf4917-collection-empty">
          <Tags />
          <h2>Chưa có bộ sưu tập</h2>
          <p>
            Tạo bộ sưu tập đầu tiên để nhóm sản phẩm và hiển thị trên
            storefront.
          </p>
          <Btn onClick={() => setEditing(blank())}>
            <Plus />
            Tạo bộ sưu tập
          </Btn>
        </section>
      )}
      <datalist id="tf508-vendors">
        {vendors.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="tf508-tags">
        {tags.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      <datalist id="tf508-product-types">
        {productTypes.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
      {editing && (
        <div className="collection-modal-shell">
          <button
            className="collection-modal-backdrop"
            aria-label="Đóng"
            onClick={() => setEditing(null)}
          />
          <section className="collection-modal tf4917-collection-modal tf508-collection-modal">
            <header>
              <div>
                <small>BỘ SƯU TẬP</small>
                <h2>
                  {collections.some((c) => c.id === editing.id)
                    ? "Chỉnh sửa bộ sưu tập"
                    : "Tạo bộ sưu tập"}
                </h2>
              </div>
              <button
                className="icon-btn"
                onClick={() => setEditing(null)}
                aria-label="Đóng"
              >
                <X />
              </button>
            </header>
            <div className="collection-modal-body">
              <div className="collection-form-main">
                <section className="collection-form-card tf508-collection-details">
                  <Field label="Tên bộ sưu tập">
                    <Input
                      autoFocus
                      value={editing.title}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          title: e.target.value,
                          handle: editing.handle || slugify(e.target.value),
                        })
                      }
                      placeholder="Ví dụ: Đồng hồ giảm từ 20%"
                    />
                  </Field>
                  <Field label="Mô tả">
                    <Textarea
                      rows={4}
                      value={editing.description}
                      onChange={(e) =>
                        setEditing({ ...editing, description: e.target.value })
                      }
                      placeholder="Giới thiệu ngắn gọn về nhóm sản phẩm"
                    />
                  </Field>
                  <Field label="URL handle">
                    <div className="handle">
                      <span>collections/</span>
                      <Input
                        value={editing.handle}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            handle: slugify(e.target.value),
                          })
                        }
                      />
                    </div>
                  </Field>
                </section>
                <section className="collection-form-card tf508-products-card">
                  <div className="collection-section-head">
                    <div>
                      <h3>
                        {editing.type === "manual"
                          ? "Sản phẩm"
                          : "Điều kiện sản phẩm"}
                      </h3>
                      <p>
                        {editing.type === "manual"
                          ? `${picked} sản phẩm đã chọn`
                          : `${automaticMatches.length} sản phẩm đang khớp điều kiện.`}
                      </p>
                    </div>
                    {editing.type === "automatic" && (
                      <span className="tf508-live-count">
                        <i />
                        {automaticMatches.length} khớp
                      </span>
                    )}
                  </div>
                  {editing.type === "manual" ? (
                    <>
                      <div className="product-picker-search">
                        <Search />
                        <Input
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          placeholder="Tìm sản phẩm, SKU hoặc thương hiệu"
                        />
                      </div>
                      <div className="product-picker">
                        {shownProducts.map((p) => (
                          <label key={p.id}>
                            <input
                              type="checkbox"
                              checked={editing.productIds.includes(p.id)}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  productIds: e.target.checked
                                    ? [...editing.productIds, p.id]
                                    : editing.productIds.filter(
                                        (x) => x !== p.id,
                                      ),
                                })
                              }
                            />
                            <img src={p.images[0]} alt="" />
                            <span>
                              <b>{p.title}</b>
                              <small>
                                {p.vendor || "Không có thương hiệu"} ·{" "}
                                {p.sku || "Chưa SKU"}
                              </small>
                            </span>
                            <strong>{money(p.price)}</strong>
                          </label>
                        ))}
                        {!shownProducts.length && (
                          <p className="picker-empty">
                            Không tìm thấy sản phẩm phù hợp.
                          </p>
                        )}
                      </div>
                      {productMatches.length > shownProducts.length && (
                        <p className="tf508-picker-limit">
                          Đang hiển thị 80/{productMatches.length} kết quả. Nhập
                          từ khóa để thu hẹp danh sách.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="tf508-condition-builder">
                      <div className="tf508-match-mode">
                        <span>Sản phẩm phải khớp</span>
                        <div>
                          <button
                            type="button"
                            className={
                              (editing.conditionMatch || "all") === "all"
                                ? "is-active"
                                : ""
                            }
                            onClick={() =>
                              setEditing({ ...editing, conditionMatch: "all" })
                            }
                          >
                            Tất cả điều kiện
                          </button>
                          <button
                            type="button"
                            className={
                              editing.conditionMatch === "any"
                                ? "is-active"
                                : ""
                            }
                            onClick={() =>
                              setEditing({ ...editing, conditionMatch: "any" })
                            }
                          >
                            Bất kỳ điều kiện
                          </button>
                        </div>
                      </div>
                      <div className="tf508-condition-presets">
                        <span>
                          <Sparkles />
                          Mẫu nhanh
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            addPreset({
                              field: "discountPercent",
                              operator: "greater_than",
                              value: "0",
                            })
                          }
                        >
                          Đang giảm giá
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addPreset({
                              field: "discountPercent",
                              operator: "greater_or_equal",
                              value: "20",
                            })
                          }
                        >
                          Giảm từ 20%
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addPreset({
                              field: "inventory",
                              operator: "greater_than",
                              value: "0",
                            })
                          }
                        >
                          Còn hàng
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addPreset({
                              field: "gender",
                              operator: "equals",
                              value: "Nam",
                            })
                          }
                        >
                          Đồng hồ Nam
                        </button>
                      </div>
                      <div className="tf508-condition-list">
                        {(editing.conditions || []).map((condition, index) => (
                          <article
                            className="tf508-condition-row"
                            key={`${index}-${condition.field}`}
                          >
                            <span className="tf508-condition-number">
                              {index + 1}
                            </span>
                            <Select
                              aria-label="Trường điều kiện"
                              value={condition.field}
                              onChange={(event) =>
                                changeConditionField(
                                  index,
                                  event.target.value as Condition["field"],
                                )
                              }
                            >
                              {collectionFieldOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                            <Select
                              aria-label="Phép so sánh"
                              value={condition.operator}
                              onChange={(event) =>
                                patchCondition(index, {
                                  operator: event.target
                                    .value as Condition["operator"],
                                })
                              }
                            >
                              {collectionOperatorOptions(condition.field).map(
                                (option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ),
                              )}
                            </Select>
                            {renderConditionValue(condition, index)}
                            <button
                              type="button"
                              className="tf508-condition-remove"
                              onClick={() =>
                                setEditing({
                                  ...editing,
                                  conditions: editing.conditions.filter(
                                    (_, conditionIndex) =>
                                      conditionIndex !== index,
                                  ),
                                })
                              }
                              aria-label={`Xóa điều kiện ${index + 1}`}
                            >
                              <Trash2 />
                            </button>
                          </article>
                        ))}
                        {!(editing.conditions || []).length && (
                          <div className="tf508-condition-empty">
                            <ListFilter />
                            <b>Chưa có điều kiện</b>
                            <span>
                              Thêm ít nhất một điều kiện để hệ thống tìm đúng
                              sản phẩm.
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="tf508-add-condition"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            conditions: [
                              ...(editing.conditions || []),
                              blankCollectionCondition(),
                            ],
                          })
                        }
                      >
                        <Plus />
                        Thêm điều kiện
                      </button>
                      <section className="tf508-auto-preview">
                        <header>
                          <div>
                            <SlidersHorizontal />
                            <span>
                              <b>Xem trước sản phẩm</b>
                              <small>
                                Cập nhật ngay khi thay đổi điều kiện
                              </small>
                            </span>
                          </div>
                          <strong>{automaticMatches.length}</strong>
                        </header>
                        <div className="product-picker-search">
                          <Search />
                          <Input
                            value={productQuery}
                            onChange={(event) =>
                              setProductQuery(event.target.value)
                            }
                            placeholder="Tìm trong kết quả khớp"
                          />
                        </div>
                        <div>
                          {shownAutomaticMatches.map((product) => (
                            <article key={product.id}>
                              <img src={product.images[0]} alt="" />
                              <span>
                                <b>{product.title}</b>
                                <small>
                                  {product.vendor || "Không có vendor"} ·{" "}
                                  {product.sku || "Chưa SKU"}
                                </small>
                              </span>
                              <em>{product.inventory} tồn</em>
                              <strong>{money(product.price)}</strong>
                            </article>
                          ))}
                          {!shownAutomaticMatches.length && (
                            <p>
                              Chưa có sản phẩm nào khớp các điều kiện hiện tại.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>
                  )}
                </section>
              </div>
              <aside className="collection-form-side">
                <section className="collection-form-card">
                  <h3>Trạng thái</h3>
                  <Select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        status: e.target.value as Collection["status"],
                      })
                    }
                  >
                    <option value="active">Hoạt động</option>
                    <option value="draft">Bản nháp</option>
                  </Select>
                  <p className="tf508-side-hint">
                    Chỉ bộ sưu tập hoạt động mới nên đưa lên menu cửa hàng.
                  </p>
                </section>
                <section className="collection-form-card">
                  <h3>Loại bộ sưu tập</h3>
                  <Select
                    value={editing.type}
                    onChange={(e) => {
                      const type = e.target.value as Collection["type"];
                      setEditing({
                        ...editing,
                        type,
                        conditions:
                          type === "automatic" &&
                          !(editing.conditions || []).length
                            ? [blankCollectionCondition()]
                            : editing.conditions,
                        conditionMatch: editing.conditionMatch || "all",
                      });
                    }}
                  >
                    <option value="manual">Thủ công</option>
                    <option value="automatic">Tự động theo điều kiện</option>
                  </Select>
                  <p className="tf508-side-hint">
                    {editing.type === "manual"
                      ? "Tự chọn từng sản phẩm."
                      : "Tự cập nhật khi catalog thay đổi."}
                  </p>
                </section>
                <section className="collection-form-card">
                  <CdnImageField
                    label="Ảnh đại diện"
                    value={editing.image}
                    folder={`timeforge/collections/${editing.handle || editing.id}`}
                    onChange={(image) => setEditing({ ...editing, image })}
                  />
                </section>
              </aside>
            </div>
            <footer>
              <span
                className={`tf508-save-status ${automaticValid ? "is-ready" : "is-warning"}`}
              >
                {editing.type === "automatic"
                  ? automaticValid
                    ? `${automaticMatches.length} sản phẩm sẽ được đưa vào bộ sưu tập`
                    : "Điền đủ giá trị cho mọi điều kiện"
                  : `${picked} sản phẩm đã chọn`}
              </span>
              <Btn variant="secondary" onClick={() => setEditing(null)}>
                Hủy
              </Btn>
              <Btn
                disabled={!editing.title.trim() || !automaticValid}
                onClick={() => {
                  saveCollection({
                    ...editing,
                    handle: editing.handle || slugify(editing.title),
                    conditionMatch: editing.conditionMatch || "all",
                  });
                  emitToast("Đã lưu bộ sưu tập.");
                  setEditing(null);
                }}
              >
                <Save />
                Lưu bộ sưu tập
              </Btn>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
export function Customers() {
  const { customers, saveCustomer } = useCommerce();
  const [editing, setEditing] = useState<Customer | null>(null),
    blank = (): Customer => ({
      id: uid("u"),
      name: "",
      email: "",
      phone: "",
      ordersCount: 0,
      totalSpent: 0,
      tags: [],
      createdAt: new Date().toISOString(),
    });
  return (
    <div className="stack">
      <div className="admin-actions">
        <p>Hồ sơ khách hàng được chuẩn bị để đồng bộ Firebase.</p>
        <Btn onClick={() => setEditing(blank())}>
          <Plus />
          Thêm khách hàng
        </Btn>
      </div>
      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Email</th>
              <th>Đơn hàng</th>
              <th>Đã chi</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                  <br />
                  <small>{c.phone}</small>
                </td>
                <td>{c.email}</td>
                <td>{c.ordersCount}</td>
                <td>{money(c.totalSpent)}</td>
                <td>
                  <Btn
                    variant="ghost"
                    onClick={() => setEditing(structuredClone(c))}
                  >
                    Sửa
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {editing && (
        <div className="modal-shell">
          <button className="modal-backdrop" onClick={() => setEditing(null)} />
          <section className="modal card">
            <header>
              <h2>Khách hàng</h2>
              <button onClick={() => setEditing(null)}>
                <X />
              </button>
            </header>
            <Field label="Họ tên">
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Field label="Email">
              <Input
                value={editing.email}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </Field>
            <Field label="Số điện thoại">
              <Input
                value={editing.phone}
                onChange={(e) =>
                  setEditing({ ...editing, phone: e.target.value })
                }
              />
            </Field>
            <footer>
              <Btn variant="secondary" onClick={() => setEditing(null)}>
                Hủy
              </Btn>
              <Btn
                onClick={() => {
                  saveCustomer(editing);
                  setEditing(null);
                }}
              >
                Lưu
              </Btn>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
export function ImportExport() {
  const {
    products,
    headers,
    setHeaders,
    mergeProducts,
    replaceProducts,
    firebaseEnabled,
  } = useCommerce();
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<ImportResult | null>(null),
    [publish, setPublish] = useState(true),
    [mode, setMode] = useState<"merge" | "replace">("merge"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const inspect = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    setError("");
    if (!f) return;
    setBusy(true);
    try {
      setPreview(await parseShopifyCsv(f, publish));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không đọc được CSV");
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const result = await parseShopifyCsv(file, publish);
      if (mode === "replace") await replaceProducts(result.products);
      else await mergeProducts(result.products);
      setHeaders(result.headers);
      setPreview(result);
      emitToast(
        firebaseEnabled
          ? `Đã lưu ${result.products.length} sản phẩm lên Firebase và tự động đồng bộ nhóm SKU.`
          : `Đã nhập ${result.products.length} sản phẩm và tự động đồng bộ nhóm SKU.`,
      );
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Không thể nhập CSV.";
      setError(message);
      emitToast(message, "danger");
    } finally {
      setBusy(false);
    }
  };
  const updating =
      preview?.products.filter((p) =>
        products.some(
          (x) => x.handle === p.handle || (p.sku && x.sku === p.sku),
        ),
      ).length || 0,
    newCount = (preview?.products.length || 0) - updating;
  return (
    <div className="import-export-page">
      <section className="card import-card import-card-primary">
        <header className="import-card-head">
          <div className="import-icon">
            <FileUp />
          </div>
          <div>
            <h2>Nhập CSV vào Firebase theo SKU</h2>
            <p>
              Tự nhận diện file Shopify hoặc CSV thường, lấy URL hình ảnh từ các
              cột ảnh và dùng SKU làm ID sản phẩm.
            </p>
          </div>
        </header>
        <label className={`upload-file ${file ? "has-file" : ""}`}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => void inspect(e.target.files?.[0] || null)}
          />
          <UploadCloud />
          <div>
            <b>{file?.name || "Thả file CSV vào đây"}</b>
            <span>
              {busy
                ? "Đang phân tích dữ liệu..."
                : file
                  ? "Bấm để chọn file khác"
                  : "Hoặc bấm để chọn từ máy"}
            </span>
          </div>
        </label>
        {error && (
          <div className="alert error">
            <AlertTriangle />
            {error}
          </div>
        )}
        {preview && (
          <>
            <div className="import-preview-stats">
              <article>
                <span>Headers</span>
                <b>{preview.headers.length}</b>
              </article>
              <article>
                <span>Dòng dữ liệu</span>
                <b>{preview.rowCount}</b>
              </article>
              <article>
                <span>Sản phẩm</span>
                <b>{preview.products.length}</b>
              </article>
              <article>
                <span>Bản nháp</span>
                <b>{preview.draftCount}</b>
              </article>
            </div>
            <div className="conflict-preview">
              <div className="conflict-head">
                <div>
                  <h3>Xem trước thay đổi</h3>
                  <p>
                    <b>{newCount}</b> mới · <b>{updating}</b> cập nhật
                  </p>
                </div>
                <Badge tone={updating ? "warning" : "success"}>
                  {updating ? "Có dữ liệu trùng" : "Sẵn sàng"}
                </Badge>
              </div>
              <div className="conflict-list">
                {preview.products.slice(0, 6).map((p) => {
                  const exists = products.some(
                    (x) => x.handle === p.handle || (p.sku && x.sku === p.sku),
                  );
                  return (
                    <article className="conflict-product-card" key={p.id}>
                      <div className="conflict-product-media">
                        <img src={p.images[0]} alt={p.title} />
                      </div>
                      <div className="conflict-product-copy">
                        <b>{p.title}</b>
                        <small>
                          SKU {p.sku} · /timeforge/products/{p.sku}
                        </small>
                      </div>
                      <div className="tf509-import-badges">
                        <Badge
                          tone={
                            p.status === "active" && p.published
                              ? "success"
                              : p.status === "draft"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {p.status === "active" && p.published
                            ? "Hiển thị"
                            : p.status === "draft"
                              ? "Bản nháp"
                              : "Lưu trữ"}
                        </Badge>
                        <Badge tone={exists ? "warning" : "success"}>
                          {exists ? "Cập nhật" : "Mới"}
                        </Badge>
                      </div>
                    </article>
                  );
                })}
              </div>
              {preview.warnings.length > 0 && (
                <div className="alert warning">
                  <AlertTriangle />
                  <div>
                    <b>Cần kiểm tra</b>
                    {preview.warnings.slice(0, 5).map((item) => (
                      <small key={item}>{item}</small>
                    ))}
                  </div>
                </div>
              )}
              {preview.products.length > 6 && (
                <p className="more-items">
                  Và {preview.products.length - 6} sản phẩm khác
                </p>
              )}
            </div>
          </>
        )}
        <div className="import-settings">
          <label className="check">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => {
                setPublish(e.target.checked);
                if (file) void inspect(file);
              }}
            />
            <span>
              <b>Trạng thái mặc định khi thiếu Status</b>
              <small>
                Chỉ áp dụng cho dòng không có Status. active, draft và archive
                trong file luôn được giữ nguyên.
              </small>
            </span>
          </label>
          <Field label="Xử lý sản phẩm trùng">
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="merge">Cập nhật và giữ dữ liệu hiện có</option>
              <option value="replace">Thay toàn bộ catalog</option>
            </Select>
          </Field>
        </div>
        <footer className="import-actions">
          <span>
            {preview
              ? `${preview.products.length} sản phẩm sẵn sàng · ${firebaseEnabled ? "sẽ ghi Firebase" : "đang ở chế độ local"}`
              : "Chọn CSV để bắt đầu"}
          </span>
          <Btn disabled={!preview || busy} onClick={() => void apply()}>
            {busy
              ? "Đang xử lý"
              : `Nhập ${preview?.products.length || 0} sản phẩm`}
          </Btn>
        </footer>
      </section>
      <aside className="import-export-side">
        <section className="card import-card export-card">
          <header className="import-card-head">
            <div className="import-icon">
              <Download />
            </div>
            <div>
              <h2>Xuất Shopify CSV</h2>
              <p>Xuất catalog theo header gần nhất đã nhập.</p>
            </div>
          </header>
          <div className="export-summary">
            <div>
              <span>Sản phẩm</span>
              <b>{products.length}</b>
            </div>
            <div>
              <span>Header</span>
              <b>{headers.length || "Mặc định"}</b>
            </div>
            <div>
              <span>Variants</span>
              <b>{products.reduce((sum, p) => sum + p.variants.length, 0)}</b>
            </div>
          </div>
          <Btn
            onClick={() =>
              download(
                exportShopifyCsv(products, headers),
                "timeforge-products.csv",
              )
            }
          >
            <Download />
            Xuất tất cả sản phẩm
          </Btn>
          <p className="fine">
            Metafield và cột chưa nhận diện vẫn được giữ từ rawShopify khi có.
          </p>
        </section>
        <section className="card import-help">
          <h3>Chuẩn dữ liệu khuyên dùng</h3>
          <ol>
            <li>
              Mỗi sản phẩm phải có <b>SKU duy nhất</b>.
            </li>
            <li>
              Cột ảnh có thể là <b>Image Src, Image URL, Hình ảnh</b> hoặc nhiều
              cột ảnh.
            </li>
            <li>
              SKU không được chứa <b>. # $ [ ] /</b> vì đây là ký tự cấm trong
              Firebase.
            </li>
          </ol>
        </section>
      </aside>
    </div>
  );
}
function SortableBlockNode({
  block,
  onSelect,
}: {
  block: ThemeBlock;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
    >
      <span className="block-grip" {...attributes} {...listeners}>
        <GripVertical />
      </span>
      {blockLabels[block.type]}
      {!block.visible && <EyeOff />}
    </button>
  );
}
function SortableSection({
  section,
  selected,
  onSelect,
  onToggle,
  onDuplicate,
  onDelete,
  onBlock,
  onBlocksReorder,
}: {
  section: Section;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBlock: (id: string) => void;
  onBlocksReorder: (active: string, over: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: section.id }),
    blockSensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`theme-section-node ${selected ? "selected" : ""}`}
    >
      <div className="theme-section-row" onClick={onSelect}>
        <button className="drag-handle" {...attributes} {...listeners}>
          <GripVertical />
        </button>
        <div>
          <b>{sectionLabels[section.type]}</b>
          <span>
            {section.visible ? "Đang hiển thị" : "Đang ẩn"} ·{" "}
            {section.blocks.length} block
          </span>
        </div>
        <aside>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {section.visible ? <Eye /> : <EyeOff />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 />
          </button>
        </aside>
      </div>
      {selected && section.blocks.length > 0 && (
        <DndContext
          sensors={blockSensors}
          onDragEnd={(e) => {
            if (e.over && e.active.id !== e.over.id)
              onBlocksReorder(String(e.active.id), String(e.over.id));
          }}
        >
          <SortableContext
            items={section.blocks.map((x) => x.id)}
            strategy={rectSortingStrategy}
          >
            <div className="block-tree">
              {section.blocks.map((bl) => (
                <SortableBlockNode
                  key={bl.id}
                  block={bl}
                  onSelect={() => onBlock(bl.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </article>
  );
}
const fieldName = (key: string) =>
  (
    ({
      text: "Nội dung",
      title: "Tiêu đề",
      eyebrow: "Nhãn nhỏ",
      label: "Nhãn nút",
      link: "Liên kết",
      image: "Hình ảnh URL",
      height: "Chiều cao",
      overlay: "Độ phủ nền",
      alignment: "Canh nội dung",
      limit: "Số lượng",
      columns: "Số cột",
      gallerySize: "Kích thước gallery",
      thumbnailPosition: "Vị trí thumbnail",
      showVendor: "Hiện thương hiệu",
      showSku: "Hiện SKU",
      showStock: "Hiện tồn kho",
      showCompare: "Hiện giá so sánh",
      showDiscount: "Hiện giảm giá",
      showBuyNow: "Hiện nút mua ngay",
      showWishlist: "Hiện yêu thích",
      source: "Nguồn nội dung",
      open: "Mở mặc định",
      background: "Kiểu nền",
      imagePosition: "Vị trí ảnh",
      contentWidth: "Chiều rộng website",
      radius: "Bo góc",
    }) as Record<string, string>
  )[key] || key;
function SettingInput({
  k,
  v,
  onChange,
}: {
  k: string;
  v: string | number | boolean;
  onChange: (v: string | number | boolean) => void;
}) {
  if (k === "image")
    return (
      <CdnImageField
        label={fieldName(k)}
        value={String(v)}
        folder="timeforge/theme/sections"
        onChange={onChange}
      />
    );
  if (typeof v === "boolean")
    return (
      <label className="switch-row">
        <span>{fieldName(k)}</span>
        <input
          type="checkbox"
          checked={v}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  if (
    [
      "alignment",
      "imagePosition",
      "thumbnailPosition",
      "gallerySize",
      "background",
      "style",
      "source",
      "width",
      "layout",
    ].includes(k)
  )
    return (
      <Field label={fieldName(k)}>
        <Select value={String(v)} onChange={(e) => onChange(e.target.value)}>
          {k === "alignment" && (
            <>
              <option value="left">Trái</option>
              <option value="center">Giữa</option>
              <option value="right">Phải</option>
            </>
          )}
          {k === "imagePosition" && (
            <>
              <option value="left">Ảnh trái</option>
              <option value="right">Ảnh phải</option>
            </>
          )}
          {k === "thumbnailPosition" && (
            <>
              <option value="left">Bên trái</option>
              <option value="bottom">Bên dưới</option>
            </>
          )}
          {k === "gallerySize" && (
            <>
              <option value="small">Nhỏ</option>
              <option value="medium">Vừa</option>
              <option value="large">Lớn</option>
            </>
          )}
          {k === "background" && (
            <>
              <option value="dark">Tối</option>
              <option value="light">Sáng</option>
            </>
          )}
          {k === "style" && (
            <>
              <option value="primary">Nút chính</option>
              <option value="secondary">Nút phụ</option>
              <option value="link">Liên kết</option>
            </>
          )}
          {k === "source" && (
            <>
              <option value="description">Mô tả sản phẩm</option>
              <option value="shipping">Giao hàng</option>
              <option value="warranty">Bảo hành</option>
            </>
          )}
          {k === "width" && (
            <>
              <option value="narrow">Hẹp</option>
              <option value="wide">Rộng</option>
            </>
          )}
          {k === "layout" && (
            <>
              <option value="cards">Thẻ ảnh</option>
              <option value="minimal">Tối giản</option>
            </>
          )}
        </Select>
      </Field>
    );
  if (k === "text")
    return (
      <Field label={fieldName(k)}>
        <Textarea
          rows={4}
          value={String(v)}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  return (
    <Field label={fieldName(k)}>
      <Input
        type={typeof v === "number" ? "number" : "text"}
        value={String(v)}
        onChange={(e) =>
          onChange(
            typeof v === "number" ? Number(e.target.value) : e.target.value,
          )
        }
      />
    </Field>
  );
}
export function OnlineStore() {
  const {
    draftTheme,
    themeState,
    saveThemeDraft,
    publishTheme,
    restoreThemeVersion,
  } = useCommerce();
  const [theme, setTheme] = useState<Theme>(() => structuredClone(draftTheme)),
    [template, setTemplate] = useState<TemplateKey>("home"),
    [selectedSection, setSelectedSection] = useState(
      theme.templates.home.sections[0]?.id || "",
    ),
    [selectedBlock, setSelectedBlock] = useState(""),
    [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop"),
    [history, setHistory] = useState<Theme[]>([]),
    [future, setFuture] = useState<Theme[]>([]),
    [panel, setPanel] = useState<"editor" | "settings" | "history">("editor");
  const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    ),
    current = theme.templates[template],
    section = current.sections.find((s) => s.id === selectedSection),
    block = section?.blocks.find((b) => b.id === selectedBlock),
    dirty = JSON.stringify(theme) !== JSON.stringify(draftTheme);
  const commit = (next: Theme) => {
    setHistory((h) => [...h, structuredClone(theme)].slice(-40));
    setFuture([]);
    setTheme(next);
  };
  const setSections = (sections: Section[]) =>
    commit({
      ...theme,
      templates: { ...theme.templates, [template]: { ...current, sections } },
    });
  const patchSection = (next: Partial<Section>) =>
    section &&
    setSections(
      current.sections.map((s) =>
        s.id === section.id ? { ...s, ...next } : s,
      ),
    );
  const patchBlock = (next: Partial<ThemeBlock>) =>
    section &&
    block &&
    patchSection({
      blocks: section.blocks.map((b) =>
        b.id === block.id ? { ...b, ...next } : b,
      ),
    });
  const switchTemplate = (key: TemplateKey) => {
    setTemplate(key);
    const first = theme.templates[key].sections[0];
    setSelectedSection(first?.id || "");
    setSelectedBlock("");
  };
  const drag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setSections(
      arrayMove(
        current.sections,
        current.sections.findIndex((s) => s.id === e.active.id),
        current.sections.findIndex((s) => s.id === e.over?.id),
      ),
    );
  };
  const undo = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setFuture((f) => [structuredClone(theme), ...f]);
    setHistory((h) => h.slice(0, -1));
    setTheme(prev);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((h) => [...h, structuredClone(theme)]);
    setFuture((f) => f.slice(1));
    setTheme(next);
  };
  const addSection = (type: SectionType) => {
    const next = createSection(type);
    setSections([...current.sections, next]);
    setSelectedSection(next.id);
    setSelectedBlock("");
  };
  const addBlock = (type: BlockType) => {
    if (!section) return;
    const next: ThemeBlock = {
      id: uid("b"),
      type,
      visible: true,
      settings:
        type === "heading"
          ? { eyebrow: "", text: "Tiêu đề mới" }
          : type === "text"
            ? { text: "Nội dung mới" }
            : type === "button"
              ? { label: "Xem thêm", link: "/collections", style: "primary" }
              : type === "iconText"
                ? { icon: "shield", title: "Cam kết", text: "Nội dung cam kết" }
                : type === "accordion"
                  ? { title: "Nội dung", source: "description", open: false }
                  : {},
    };
    patchSection({ blocks: [...section.blocks, next] });
    setSelectedBlock(next.id);
  };
  return (
    <div className="theme-page-v2">
      <div className="theme-topbar-v2">
        <div className="theme-template-select">
          <span>Template</span>
          <Select
            value={template}
            onChange={(e) => switchTemplate(e.target.value as TemplateKey)}
          >
            {(Object.keys(templateLabels) as TemplateKey[]).map((k) => (
              <option value={k} key={k}>
                {templateLabels[k]}
              </option>
            ))}
          </Select>
        </div>
        <div className="theme-tabs-v2">
          <button
            className={panel === "editor" ? "active" : ""}
            onClick={() => setPanel("editor")}
          >
            Sections
          </button>
          <button
            className={panel === "settings" ? "active" : ""}
            onClick={() => setPanel("settings")}
          >
            Cài đặt theme
          </button>
          <button
            className={panel === "history" ? "active" : ""}
            onClick={() => setPanel("history")}
          >
            Lịch sử
          </button>
        </div>
        <div className="devices">
          <button
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
          >
            <Monitor />
          </button>
          <button
            className={device === "tablet" ? "active" : ""}
            onClick={() => setDevice("tablet")}
          >
            <Laptop />
          </button>
          <button
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone />
          </button>
        </div>
        <div className="theme-actions-v2">
          <button disabled={!history.length} onClick={undo}>
            <Undo2 />
          </button>
          <button disabled={!future.length} onClick={redo}>
            <Redo2 />
          </button>
          <span className={dirty ? "dirty" : "saved"}>
            {dirty ? "Chưa lưu" : "Đã lưu draft"}
          </span>
          <Btn variant="secondary" onClick={() => saveThemeDraft(theme)}>
            <Save />
            Lưu nháp
          </Btn>
          <Btn
            onClick={() => {
              saveThemeDraft(theme);
              publishTheme(theme);
            }}
          >
            Xuất bản
          </Btn>
        </div>
      </div>
      <div className="theme-workspace-v2">
        <aside className="theme-left-v2">
          {panel === "editor" && (
            <>
              <header>
                <small>CẤU TRÚC TEMPLATE</small>
                <h2>{templateLabels[template]}</h2>
                <p>
                  Kéo section để đổi thứ tự. Bấm section hoặc block để chỉnh.
                </p>
              </header>
              <DndContext sensors={sensors} onDragEnd={drag}>
                <SortableContext
                  items={current.sections.map((s) => s.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="theme-tree-v2">
                    {current.sections.map((s) => (
                      <SortableSection
                        key={s.id}
                        section={s}
                        selected={s.id === selectedSection}
                        onSelect={() => {
                          setSelectedSection(s.id);
                          setSelectedBlock("");
                        }}
                        onBlock={(id) => {
                          setSelectedSection(s.id);
                          setSelectedBlock(id);
                        }}
                        onBlocksReorder={(active, over) =>
                          setSections(
                            current.sections.map((x) =>
                              x.id === s.id
                                ? {
                                    ...x,
                                    blocks: arrayMove(
                                      x.blocks,
                                      x.blocks.findIndex(
                                        (b) => b.id === active,
                                      ),
                                      x.blocks.findIndex((b) => b.id === over),
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                        onToggle={() =>
                          setSections(
                            current.sections.map((x) =>
                              x.id === s.id ? { ...x, visible: !x.visible } : x,
                            ),
                          )
                        }
                        onDuplicate={() => {
                          const copy = structuredClone(s);
                          copy.id = uid("s");
                          copy.blocks = copy.blocks.map((b) => ({
                            ...b,
                            id: uid("b"),
                          }));
                          const a = [...current.sections],
                            i = a.findIndex((x) => x.id === s.id);
                          a.splice(i + 1, 0, copy);
                          setSections(a);
                        }}
                        onDelete={() => {
                          if (current.sections.length <= 1) return;
                          setSections(
                            current.sections.filter((x) => x.id !== s.id),
                          );
                          setSelectedSection(
                            current.sections.find((x) => x.id !== s.id)?.id ||
                              "",
                          );
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="add-section-v2">
                <b>Thêm section</b>
                {allowedSections[template].map((type) => (
                  <button key={type} onClick={() => addSection(type)}>
                    <Plus />
                    {sectionLabels[type]}
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === "settings" && (
            <div className="global-theme-settings">
              <header>
                <small>THEME SETTINGS</small>
                <h2>Nhận diện & layout</h2>
              </header>
              <Field label="Tên theme">
                <Input
                  value={theme.name}
                  onChange={(e) => commit({ ...theme, name: e.target.value })}
                />
              </Field>
              <Field label="Tên cửa hàng">
                <Input
                  value={theme.settings.storeName}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: {
                        ...theme.settings,
                        storeName: e.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Logo chữ">
                <Input
                  value={theme.settings.logoText}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: { ...theme.settings, logoText: e.target.value },
                    })
                  }
                />
              </Field>
              <CdnImageField
                label="Logo hình"
                value={theme.settings.logoImage}
                folder="timeforge/theme/logo"
                onChange={(logoImage) =>
                  commit({
                    ...theme,
                    settings: { ...theme.settings, logoImage },
                  })
                }
              />
              <Field label="Thanh thông báo">
                <Input
                  value={theme.settings.announcement}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: {
                        ...theme.settings,
                        announcement: e.target.value,
                      },
                    })
                  }
                />
              </Field>
              <label className="switch-row">
                <span>Hiện thanh thông báo</span>
                <input
                  type="checkbox"
                  checked={theme.settings.showAnnouncement}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: {
                        ...theme.settings,
                        showAnnouncement: e.target.checked,
                      },
                    })
                  }
                />
              </label>
              <label className="switch-row">
                <span>Header cố định</span>
                <input
                  type="checkbox"
                  checked={theme.settings.stickyHeader}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: {
                        ...theme.settings,
                        stickyHeader: e.target.checked,
                      },
                    })
                  }
                />
              </label>
              <div className="theme-color-grid">
                {[
                  ["accent", "Màu nhấn"],
                  ["background", "Nền trang"],
                  ["surface", "Nền card"],
                  ["text", "Màu chữ"],
                  ["muted", "Chữ phụ"],
                ].map(([k, l]) => (
                  <Field label={l} key={k}>
                    <Input
                      type="color"
                      value={String(
                        theme.settings[k as keyof typeof theme.settings],
                      )}
                      onChange={(e) =>
                        commit({
                          ...theme,
                          settings: { ...theme.settings, [k]: e.target.value },
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
              <Field label="Bo góc">
                <Input
                  type="range"
                  min="0"
                  max="32"
                  value={theme.settings.radius}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: {
                        ...theme.settings,
                        radius: Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Chiều rộng nội dung">
                <Input
                  type="range"
                  min="1100"
                  max="1680"
                  step="20"
                  value={theme.settings.contentWidth}
                  onChange={(e) =>
                    commit({
                      ...theme,
                      settings: {
                        ...theme.settings,
                        contentWidth: Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </div>
          )}
          {panel === "history" && (
            <div className="theme-history">
              <header>
                <small>VERSION HISTORY</small>
                <h2>Các bản đã xuất bản</h2>
              </header>
              {!themeState.versions.length ? (
                <p>Chưa có phiên bản cũ.</p>
              ) : (
                themeState.versions.map((v) => (
                  <article key={v.id}>
                    <History />
                    <div>
                      <b>{new Date(v.createdAt).toLocaleString("vi-VN")}</b>
                      <span>{v.note}</span>
                    </div>
                    <Btn
                      variant="secondary"
                      onClick={() => {
                        restoreThemeVersion(v.id);
                        setTheme(structuredClone(v.theme));
                        setPanel("editor");
                      }}
                    >
                      Khôi phục draft
                    </Btn>
                  </article>
                ))
              )}
            </div>
          )}
        </aside>
        <main className={`theme-preview-v2 ${device}`}>
          <div>
            <ThemePreviewCanvas theme={theme} template={template} />
          </div>
        </main>
        <aside className="theme-inspector-v2">
          {panel === "editor" &&
            (block ? (
              <>
                <header>
                  <small>BLOCK</small>
                  <h2>{blockLabels[block.type]}</h2>
                  <div>
                    <button
                      onClick={() => patchBlock({ visible: !block.visible })}
                    >
                      {block.visible ? <Eye /> : <EyeOff />}
                    </button>
                    <button
                      onClick={() => {
                        if (!section) return;
                        const copy = {
                          ...structuredClone(block),
                          id: uid("b"),
                        };
                        const list = [...section.blocks],
                          i = list.findIndex((x) => x.id === block.id);
                        list.splice(i + 1, 0, copy);
                        patchSection({ blocks: list });
                        setSelectedBlock(copy.id);
                      }}
                    >
                      <Copy />
                    </button>
                    <button
                      onClick={() => {
                        if (!section) return;
                        patchSection({
                          blocks: section.blocks.filter(
                            (x) => x.id !== block.id,
                          ),
                        });
                        setSelectedBlock("");
                      }}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </header>
                <div className="inspector-fields">
                  {Object.entries(block.settings).map(([k, v]) => (
                    <SettingInput
                      key={k}
                      k={k}
                      v={v}
                      onChange={(value) =>
                        patchBlock({
                          settings: { ...block.settings, [k]: value },
                        })
                      }
                    />
                  ))}
                </div>
              </>
            ) : section ? (
              <>
                <header>
                  <small>SECTION</small>
                  <h2>{sectionLabels[section.type]}</h2>
                  <div>
                    <button
                      onClick={() =>
                        patchSection({ visible: !section.visible })
                      }
                    >
                      {section.visible ? <Eye /> : <EyeOff />}
                    </button>
                  </div>
                </header>
                <div className="inspector-fields">
                  {Object.entries(section.settings).map(([k, v]) => (
                    <SettingInput
                      key={k}
                      k={k}
                      v={v}
                      onChange={(value) =>
                        patchSection({
                          settings: { ...section.settings, [k]: value },
                        })
                      }
                    />
                  ))}
                </div>
                {allowedBlocks[section.type]?.length && (
                  <div className="add-block-v2">
                    <b>Thêm block</b>
                    {allowedBlocks[section.type]?.map((type) => (
                      <button key={type} onClick={() => addBlock(type)}>
                        <Plus />
                        {blockLabels[type]}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="inspector-empty">
                <LayoutTemplate />
                <h3>Chọn section hoặc block</h3>
                <p>Cài đặt phù hợp sẽ xuất hiện tại đây.</p>
              </div>
            ))}
        </aside>
      </div>
    </div>
  );
}
export function Orders() {
  return (
    <Empty
      icon={<ShoppingBag />}
      title="Chưa kết nối đơn hàng"
      text="Orders sẽ được kết nối cùng Firebase và checkout ở Sprint tiếp theo."
    />
  );
}
export function Inventory() {
  const { products } = useCommerce();
  return (
    <section className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>SKU</th>
            <th>Có sẵn</th>
            <th>Giá trị tồn</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="product-cell">
                  <img src={p.images[0]} alt="" />
                  <b>{p.title}</b>
                </div>
              </td>
              <td>{p.sku || "—"}</td>
              <td>{p.inventory}</td>
              <td>{money(p.inventory * p.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
export function Analytics() {
  const { products, customers } = useCommerce();
  return (
    <div className="stack">
      <section className="metrics">
        <Metric
          icon={<Boxes />}
          label="Đang bán"
          value={String(products.filter((p) => p.status === "active").length)}
          note={`Trong ${products.length} sản phẩm`}
        />
        <Metric
          icon={<BarChart3 />}
          label="Giá trung bình"
          value={money(
            products.reduce((s, p) => s + p.price, 0) /
              Math.max(1, products.length),
          )}
          note="Catalog hiện tại"
        />
      </section>
      <Empty
        icon={<BarChart3 />}
        title="Analytics đang ở chế độ nền"
        text={`Đã có ${customers.length} khách hàng; doanh thu và traffic sẽ nối sau.`}
      />
    </div>
  );
}
export function SettingsPage() {
  const {
    dataSource,
    dataError,
    reset,
    themeState,
    storeProfile,
    saveStoreProfile,
  } = useCommerce();
  type StoreProfileDraft = Omit<StoreProfile, "updatedAt">;
  const profileDraft = (value: StoreProfile): StoreProfileDraft => ({
    storeName: value.storeName,
    storeDescription: value.storeDescription,
    storePhone: value.storePhone,
    storeEmail: value.storeEmail,
    storeAddress: value.storeAddress,
    taxId: value.taxId,
    facebookUrl: value.facebookUrl,
    instagramUrl: value.instagramUrl,
    tiktokUrl: value.tiktokUrl,
    recruitmentUrl: value.recruitmentUrl,
    logoImage: value.logoImage,
  });
  const [profile, setProfile] = useState<StoreProfileDraft>(() =>
    profileDraft(storeProfile),
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(storeProfile.logoImage || DEFAULT_STORE_LOGO);
  const [logoError, setLogoError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (logoFile) return;
    setProfile(profileDraft(storeProfile));
    setLogoPreview(storeProfile.logoImage || DEFAULT_STORE_LOGO);
  }, [storeProfile, logoFile]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(profile.logoImage || DEFAULT_STORE_LOGO);
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile, profile.logoImage]);

  const patchProfile = <K extends keyof StoreProfileDraft>(
    key: K,
    value: StoreProfileDraft[K],
  ) => setProfile((current) => ({ ...current, [key]: value }));

  const chooseLogo = (file: File | undefined) => {
    setLogoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Chỉ chấp nhận file ảnh PNG, JPG, JPEG hoặc WebP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoError("Ảnh logo phải nhỏ hơn 8 MB.");
      return;
    }
    setLogoFile(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    patchProfile("logoImage", "");
    setLogoPreview(DEFAULT_STORE_LOGO);
    setLogoError("");
  };

  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    setLogoError("");
    try {
      let logoImage = profile.logoImage;
      if (logoFile) {
        const uploaded = await uploadCloudinaryImage(logoFile, "shop/logo");
        logoImage = uploaded.url;
      }
      const next: StoreProfileDraft = { ...profile, logoImage };
      await saveStoreProfile(next);
      setProfile(next);
      setLogoFile(null);
      setLogoPreview(logoImage || DEFAULT_STORE_LOGO);
      emitToast("Đã lưu thông tin cửa hàng và logo lên Firebase.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu thông tin cửa hàng.";
      setLogoError(message);
      emitToast(message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const live = dataSource === "firebase",
    label =
      dataSource === "loading"
        ? "Đang tải Firebase"
        : live
          ? "Firebase live"
          : dataSource === "error"
            ? "Lỗi tải catalog"
            : dataSource === "seed"
              ? "Dữ liệu mẫu"
              : "Local mode";
  return (
    <div className="tf509-settings-page tf513-store-settings-page">
      <section className="tf509-settings-status">
        <article>
          <Wrench />
          <span>
            <small>Nguồn catalog</small>
            <b>{label}</b>
          </span>
          <i className={live ? "is-live" : ""} />
        </article>
        <article>
          <LayoutTemplate />
          <span>
            <small>Theme đang chạy</small>
            <b>{themeState.published.name}</b>
          </span>
          <strong>{themeState.versions.length} bản lưu</strong>
        </article>
        <article>
          <Globe2 />
          <span>
            <small>Thông tin storefront</small>
            <b>{resolveStoreName(profile.storeName)}</b>
          </span>
          <strong>Public</strong>
        </article>
      </section>

      <div className="tf509-settings-layout">
        <main className="card tf509-profile-card">
          <header>
            <span>
              <Building2 />
            </span>
            <div>
              <small>THÔNG TIN CHUNG</small>
              <h2>Hồ sơ Luxury TimeForge</h2>
              <p>
                Nội dung và logo được lưu trong cấu hình chung của shop trên
                Firebase, sau đó storefront tự đồng bộ.
              </p>
            </div>
          </header>

          <section>
            <div className="tf509-settings-section-title">
              <ImagePlus />
              <span>
                <b>Logo cửa hàng</b>
                <small>Chọn ảnh từ thiết bị; ảnh được tải lên Cloudinary khi lưu.</small>
              </span>
            </div>
            <div className="tf513-logo-uploader">
              <div className={`tf513-logo-preview ${logoPreview ? "has-image" : "is-empty"}`}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Xem trước logo cửa hàng" />
                ) : (
                  <span>
                    <ImagePlus />
                    <b>Chưa có logo</b>
                  </span>
                )}
              </div>
              <div className="tf513-logo-controls">
                <div>
                  <b>Ảnh nhận diện của shop</b>
                  <small>Khuyến nghị PNG/WebP nền trong, tối đa 8 MB.</small>
                </div>
                <input
                  id="tf513-store-logo-file"
                  className="tf513-logo-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={(event) => {chooseLogo(event.target.files?.[0]); event.currentTarget.value = "";}}
                />
                <div className="tf513-logo-actions">
                  <label
                    className={`tf513-logo-choose ${saving ? "is-disabled" : ""}`}
                    htmlFor="tf513-store-logo-file"
                    aria-disabled={saving}
                  >
                    <UploadCloud />
                    {logoFile || profile.logoImage ? "Thay ảnh" : "Chọn ảnh từ thiết bị"}
                  </label>
                  {(logoFile || profile.logoImage) && (
                    <button
                      className="tf513-logo-remove"
                      type="button"
                      onClick={removeLogo}
                      disabled={saving}
                    >
                      <Trash2 />
                      Xóa ảnh
                    </button>
                  )}
                </div>
                {logoFile && (
                  <small className="tf513-logo-selected">
                    Đã chọn: <b>{logoFile.name}</b>
                  </small>
                )}
                {!cloudinaryUploadConfigured && (
                  <p className="tf513-logo-warning">
                    Chưa có cấu hình Cloudinary. Cần thiết lập
                    VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.
                  </p>
                )}
                {logoError && <p className="tf513-logo-error">{logoError}</p>}
              </div>
            </div>
          </section>

          <section>
            <div className="tf509-settings-section-title">
              <Building2 />
              <span>
                <b>Nhận diện doanh nghiệp</b>
                <small>Tên hiển thị và thông tin pháp lý.</small>
              </span>
            </div>
            <div className="tf509-settings-fields">
              <Field label="Tên cửa hàng">
                <Input
                  value={profile.storeName}
                  onChange={(event) =>
                    patchProfile("storeName", event.target.value)
                  }
                  placeholder="Luxury TimeForge"
                />
              </Field>
              <Field label="Mã số thuế">
                <Input
                  value={profile.taxId}
                  onChange={(event) => patchProfile("taxId", event.target.value)}
                  placeholder="Nhập mã số thuế"
                />
              </Field>
              <Field label="Mô tả ngắn">
                <Textarea
                  value={profile.storeDescription}
                  onChange={(event) =>
                    patchProfile("storeDescription", event.target.value)
                  }
                  placeholder="Giới thiệu ngắn về cửa hàng"
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="tf509-settings-section-title">
              <Phone />
              <span>
                <b>Liên hệ</b>
                <small>Hiển thị ở footer để khách hàng liên hệ nhanh.</small>
              </span>
            </div>
            <div className="tf509-settings-fields is-two">
              <Field label="Số điện thoại">
                <Input
                  value={profile.storePhone}
                  onChange={(event) =>
                    patchProfile("storePhone", event.target.value)
                  }
                  placeholder="0900 000 000"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={profile.storeEmail}
                  onChange={(event) =>
                    patchProfile("storeEmail", event.target.value)
                  }
                  placeholder="hello@timeforge.vn"
                />
              </Field>
              <Field label="Địa chỉ">
                <Input
                  value={profile.storeAddress}
                  onChange={(event) =>
                    patchProfile("storeAddress", event.target.value)
                  }
                  placeholder="Số nhà, đường, phường, tỉnh/thành phố"
                />
              </Field>
            </div>
          </section>

          <section>
            <div className="tf509-settings-section-title">
              <Globe2 />
              <span>
                <b>Kênh social & tuyển dụng</b>
                <small>
                  Chỉ kênh có URL hợp lệ mới xuất hiện trên storefront.
                </small>
              </span>
            </div>
            <div className="tf509-settings-fields is-two">
              {[
                ["facebookUrl", "Facebook", "https://facebook.com/..."],
                ["instagramUrl", "Instagram", "https://instagram.com/..."],
                ["tiktokUrl", "TikTok", "https://tiktok.com/@..."],
                ["recruitmentUrl", "Tuyển dụng", "https://..."],
              ].map(([key, labelText, placeholder]) => (
                <Field label={labelText} key={key}>
                  <Input
                    type="url"
                    inputMode="url"
                    value={profile[key as keyof StoreProfileDraft]}
                    onChange={(event) =>
                      patchProfile(
                        key as keyof StoreProfileDraft,
                        event.target.value,
                      )
                    }
                    placeholder={placeholder}
                  />
                </Field>
              ))}
            </div>
          </section>
        </main>

        <aside className="tf509-settings-side">
          <section className="card tf509-settings-publish">
            <header>
              <Sparkles />
              <span>
                <b>Cập nhật storefront</b>
                <small>
                  Upload logo lên Cloudinary và lưu toàn bộ object vào Firebase.
                </small>
              </span>
            </header>
            <div>
              <span>
                <Phone />
                {profile.storePhone || "Chưa có số điện thoại"}
              </span>
              <span>
                <Mail />
                {profile.storeEmail || "Chưa có email"}
              </span>
              <span>
                <MapPin />
                {profile.storeAddress || "Chưa có địa chỉ"}
              </span>
              <span>
                <BriefcaseBusiness />
                {profile.recruitmentUrl ? "Đã có trang tuyển dụng" : "Chưa có"}
              </span>
            </div>
            <Btn onClick={() => void saveProfile()} disabled={saving}>
              <Save />
              {saving
                ? logoFile
                  ? "Đang upload logo..."
                  : "Đang lưu..."
                : "Lưu thông tin"}
            </Btn>
          </section>

          <section className="card tf509-settings-utility">
            <h3>Công cụ liên quan</h3>
            <p>
              {live
                ? "Catalog và thông tin shop đang đọc trực tiếp từ Firebase."
                : dataError || "Catalog hiện chưa được đọc từ Firebase."}
            </p>
            <Link className="btn secondary" to="/admin/online-store">
              Mở Theme Editor
            </Link>
          </section>

          <section className="card tf509-settings-danger">
            <RotateCcw />
            <div>
              <h3>Dữ liệu demo</h3>
              <p>Khôi phục sản phẩm mẫu và theme mặc định.</p>
            </div>
            <Btn
              variant="danger"
              onClick={() => {
                if (confirm("Đặt lại dữ liệu?")) reset();
              }}
            >
              Đặt lại
            </Btn>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="card empty">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}
