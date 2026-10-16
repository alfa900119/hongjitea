import { useState, useEffect } from "react";

// ─── Supabase Config ───
const SUPABASE_URL = "https://czlzuffncdrwnvhgpstd.supabase.co";
const SUPABASE_KEY = "sb_publishable_dsmwH8Ra2mmH5wH-dPclcg_9yhbQHzm";

const supaFetch = async (table, options = {}) => {
  const { method = "GET", body, query = "" } = options;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...(method === "POST" || method === "PATCH" || method === "DELETE"
      ? { Prefer: "return=representation" }
      : {}),
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) { const err = await res.text(); console.error(err); return null; }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (e) { console.error(e); return null; }
};

// ─── Supabase Storage (商品圖片) ───
const PHOTO_BUCKET = "product-photos";

const resizeImage = (blob, maxSize = 1200, quality = 0.85) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", quality);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
  img.src = url;
});

const uploadPhoto = async (blob) => {
  const resized = await resizeImage(blob);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "image/jpeg", "Cache-Control": "31536000" },
    body: resized,
  });
  if (!res.ok) { console.error(await res.text()); throw new Error("upload failed"); }
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${name}`;
};

const DEFAULT_PRODUCTS = [
  { name: "凍頂烏龍茶", price: 500, description: "兒茶素氧化程度約25-40%，果香撲鼻，茶湯入口豐富活性，生津潤喉。", icon: "🍃", weight: "150g", category: "烏龍茶", stock: 50 },
  { name: "碳焙凍頂烏龍茶", price: 600, description: "以凍頂烏龍茶為基底，使用傳統工藝碳火烘焙。兒茶素氧化程度約45-70%，厚實果香，多層次甘潤感，茶湯呈琥珀濃艷色。", icon: "🔥", weight: "150g", category: "烏龍茶", stock: 30 },
  { name: "小葉紅茶", price: 500, description: "兒茶素氧化程度約95-99%，花果香氣幽雅，醇厚回甘。", icon: "🌺", weight: "150g", category: "紅茶", stock: 40 },
  { name: "鳳凰紅烏龍", price: 600, description: "兒茶素氧化程度約50-70%，茶湯明亮澄清橙紅，滋味醇厚圓潤，有烏龍茶的醇，紅茶的香。", icon: "🦅", weight: "150g", category: "紅烏龍", stock: 35 },
  { name: "鹿谷高山茶", price: 500, description: "兒茶素氧化程度約10-20%，香氣芬芳幽雅，茶湯鮮活甜爽。", icon: "⛰️", weight: "150g", category: "高山茶", stock: 25 },
  { name: "陳年老茶", price: 1200, description: "以優質烏龍茶為基底，經多年低溫陳放與間歇復火，茶性溫潤降火氣，茶湯呈深琥珀色，陳韻蜜香，甘醇耐泡。", icon: "🍂", weight: "150g", category: "陳年老茶", stock: 20 },
  { name: "茶包", price: 300, description: "獨立茶包設計，方便沖泡，一盒30入，隨時隨地享受鴻記好茶的醇厚香氣。", icon: "🍵", weight: "一盒30入", category: "茶包", stock: 40 },
];

const injectStyles = () => {
  if (document.getElementById("hj-admin-styles")) return;
  const style = document.createElement("style");
  style.id = "hj-admin-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap');
    :root {
      --ink: #1a1612; --bg: #f4f1ec; --card: #ffffff;
      --gold: #b8956a; --gold-light: #d4b896; --gold-dark: #8a6d4a;
      --forest: #2d3a2d; --forest-light: #3d4f3d;
      --mist: #e8e2d8; --warm-gray: #a09688; --border: #e5e0d8;
      --error: #c44b4b; --error-bg: #fef2f2;
      --success: #4a7c59; --success-bg: #f0fdf4;
      --warning: #b45309; --warning-bg: #fffbeb;
      --info: #2563eb; --info-bg: #eff6ff;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans TC', sans-serif; background: var(--bg); color: var(--ink); }
    .serif { font-family: 'Noto Serif TC', serif; }
    .calligraphy { font-family: 'Noto Serif TC', serif; font-weight: 900; text-shadow: 1px 1px 0px rgba(0,0,0,0.08), -0.5px 0px 0px rgba(0,0,0,0.05); -webkit-font-smoothing: antialiased; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    ::selection { background: var(--gold-light); color: var(--ink); }
    input:focus, textarea:focus, select:focus { outline: 2px solid var(--gold); outline-offset: 1px; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--gold-light); border-radius: 3px; }
  `;
  document.head.appendChild(style);
};

export default function AdminPanel() {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dbReady, setDbReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { injectStyles(); init(); }, []);

  const init = async () => {
    setLoading(true);
    const [prods, ords] = await Promise.all([
      supaFetch("products", { query: "?order=id.asc" }),
      supaFetch("orders", { query: "?order=created_at.desc" }),
    ]);
    if (prods && prods.length > 0) { setProducts(prods); setDbReady(true); }
    if (ords) setOrders(ords);
    setLoading(false);
  };

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const initDB = async () => {
    setLoading(true);
    notify("正在初始化資料庫…", "info");
    await Promise.all(DEFAULT_PRODUCTS.map((p) => supaFetch("products", { method: "POST", body: p })));
    await init();
    notify("資料庫初始化完成！");
  };

  const saveProduct = async (product) => {
    if (!product.name?.trim()) { notify("請輸入商品名稱", "error"); return; }
    if (!product.price || product.price <= 0) { notify("請輸入有效價格", "error"); return; }
    if (product.id) {
      const { id, created_at, ...body } = product;
      const result = await supaFetch("products", { method: "PATCH", body, query: `?id=eq.${id}` });
      if (result && result.length > 0) { setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...body } : p)); notify("商品已更新"); }
      else notify("更新失敗", "error");
    } else {
      const result = await supaFetch("products", { method: "POST", body: product });
      if (result && result[0]) { setProducts((prev) => [...prev, result[0]]); notify("商品已新增"); }
      else notify("新增失敗", "error");
    }
    setEditing(null);
  };

  const deleteProduct = async (id) => {
    const result = await supaFetch("products", { method: "DELETE", query: `?id=eq.${id}` });
    if (result === null) { notify("刪除失敗，請稍後再試", "error"); setConfirmDelete(null); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
    notify("商品已刪除");
  };

  const migratePhotos = async () => {
    const targets = products.filter((p) => p.photo && p.photo.startsWith("data:"));
    if (targets.length === 0) { notify("沒有需要搬移的圖片", "info"); return; }
    notify(`正在搬移 ${targets.length} 張圖片…`, "info");
    let ok = 0;
    for (const p of targets) {
      try {
        const blob = await (await fetch(p.photo)).blob();
        const url = await uploadPhoto(blob);
        const result = await supaFetch("products", { method: "PATCH", body: { photo: url }, query: `?id=eq.${p.id}` });
        if (result && result.length > 0) { ok++; setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, photo: url } : x)); }
      } catch (e) { console.error(e); }
    }
    notify(ok === targets.length ? `已搬移 ${ok} 張圖片` : `成功 ${ok} / ${targets.length} 張，請檢查 Storage 設定`, ok === targets.length ? "success" : "error");
  };

  const updateOrderStatus = async (id, status) => {
    const result = await supaFetch("orders", { method: "PATCH", body: { status }, query: `?id=eq.${id}` });
    if (result) {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      notify(`訂單狀態已更新為「${statusLabel(status)}」`);
    }
  };

  const statusLabel = (s) => ({ pending: "待處理", processing: "處理中", shipped: "已出貨", completed: "已完成", cancelled: "已取消" }[s] || s);
  const statusColor = (s) => ({
    pending:   { bg: "var(--warning-bg)", color: "var(--warning)", border: "#fde68a" },
    processing:{ bg: "var(--info-bg)",    color: "var(--info)",    border: "#bfdbfe" },
    shipped:   { bg: "#f0f9ff",           color: "#0369a1",        border: "#bae6fd" },
    completed: { bg: "var(--success-bg)", color: "var(--success)", border: "#bbf7d0" },
    cancelled: { bg: "var(--error-bg)",   color: "var(--error)",   border: "#fecaca" },
  }[s] || { bg: "var(--mist)", color: "var(--ink)", border: "var(--border)" });

  const totalRevenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);

  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== "all" && o.status !== orderFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (o.customer_name || "").toLowerCase().includes(term) || (o.customer_phone || "").includes(term);
    }
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (!searchTerm) return true;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.category || "").includes(searchTerm);
  });

  const sidebarItems = [
    { key: "dashboard", icon: "📊", label: "總覽" },
    { key: "products",  icon: "🍃", label: "商品管理" },
    { key: "orders",    icon: "📦", label: "訂單管理" },
    { key: "settings",  icon: "⚙️", label: "設定" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: notification.type === "success" ? "var(--forest)" : notification.type === "error" ? "var(--error)" : notification.type === "info" ? "var(--info)" : "var(--warning)",
          color: "#fff", padding: "14px 24px", borderRadius: 10, fontSize: 14, fontWeight: 500,
          animation: "slideDown 0.3s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", maxWidth: 360,
        }}>{notification.msg}</div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" }}>
          <div style={{ background: "#fff", padding: 32, borderRadius: 12, maxWidth: 400, width: "90%", animation: "slideUp 0.3s ease", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>確認刪除</h3>
            <p style={{ fontSize: 14, color: "var(--warm-gray)", marginBottom: 24, lineHeight: 1.7 }}>確定要刪除「{confirmDelete.name}」嗎？此操作無法復原。</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "10px 24px", border: "1px solid var(--border)", background: "#fff", fontSize: 13, cursor: "pointer", borderRadius: 8, fontFamily: "'Noto Sans TC'" }}>取消</button>
              <button onClick={() => deleteProduct(confirmDelete.id)} style={{ padding: "10px 24px", background: "var(--error)", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", borderRadius: 8, fontFamily: "'Noto Sans TC'", fontWeight: 600 }}>確認刪除</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 240, background: "var(--forest)", color: "#fff", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img src="/logo.jpg" alt="鴻記製茶" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
            <span className="calligraphy" style={{ fontSize: 24, letterSpacing: 5 }}>鴻記製茶</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, paddingLeft: 34 }}>管理後台</div>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {sidebarItems.map((item) => (
            <button key={item.key} onClick={() => { setTab(item.key); setSearchTerm(""); setEditing(null); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", border: "none", borderRadius: 8,
              background: tab === item.key ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === item.key ? "#fff" : "rgba(255,255,255,0.6)",
              fontSize: 14, fontWeight: tab === item.key ? 600 : 400, cursor: "pointer",
              fontFamily: "'Noto Sans TC', sans-serif", transition: "all 0.2s ease",
              marginBottom: 4, textAlign: "left",
            }}
              onMouseEnter={(e) => { if (tab !== item.key) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (tab !== item.key) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
              {item.key === "orders" && pendingOrders > 0 && (
                <span style={{ marginLeft: "auto", background: "var(--error)", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: dbReady ? "#4ade80" : "var(--warm-gray)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{dbReady ? "Supabase 已連線" : "未連線"}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 240, padding: "32px 40px 60px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, animation: "pulse 1.5s ease-in-out infinite", marginBottom: 16 }}>🍵</div>
              <div style={{ color: "var(--warm-gray)", fontSize: 14 }}>載入中...</div>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Dashboard ─── */}
            {tab === "dashboard" && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>總覽</h1>
                  <p style={{ fontSize: 14, color: "var(--warm-gray)" }}>鴻記製茶後台管理系統</p>
                </div>

                {!dbReady && (
                  <div style={{ background: "var(--warning-bg)", border: "1px solid #fde68a", padding: "20px 24px", borderRadius: 12, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--warning)", marginBottom: 4 }}>資料庫尚未初始化</div>
                      <div style={{ fontSize: 13, color: "var(--warm-gray)" }}>請先在 Supabase 建立資料表，然後點擊初始化按鈕</div>
                    </div>
                    <button onClick={initDB} style={{ background: "var(--gold)", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 600, whiteSpace: "nowrap" }}>初始化 DB</button>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 36 }}>
                  {[
                    { label: "商品數量", value: products.length, unit: "項", icon: "🍃", color: "var(--forest)" },
                    { label: "總庫存",   value: totalStock,       unit: "件", icon: "📦", color: "var(--info)" },
                    { label: "待處理訂單",value: pendingOrders,   unit: "筆", icon: "⏳", color: "var(--warning)" },
                    { label: "累計營收", value: `NT$${totalRevenue.toLocaleString()}`, unit: "", icon: "💰", color: "var(--gold-dark)" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: "var(--card)", borderRadius: 12, padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid var(--border)", animation: `slideUp 0.4s ease ${i * 0.08}s both` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: "var(--warm-gray)", fontWeight: 500, letterSpacing: 0.5 }}>{stat.label}</span>
                        <span style={{ fontSize: 22 }}>{stat.icon}</span>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>
                        {stat.value}
                        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--warm-gray)", marginLeft: 4 }}>{stat.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>最近訂單</h3>
                    <button onClick={() => setTab("orders")} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 500 }}>查看全部 →</button>
                  </div>
                  {orders.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--warm-gray)", fontSize: 14 }}>目前沒有訂單</div>
                  ) : (
                    <div>
                      {orders.slice(0, 5).map((o, i) => {
                        const sc = statusColor(o.status);
                        return (
                          <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px", gap: 16, alignItems: "center", padding: "14px 24px", borderBottom: "1px solid var(--border)", animation: `slideUp 0.3s ease ${i * 0.05}s both` }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{o.customer_name}</div>
                              <div style={{ fontSize: 12, color: "var(--warm-gray)" }}>{o.customer_phone}</div>
                            </div>
                            <span className="serif" style={{ fontWeight: 600, color: "var(--gold-dark)" }}>NT${o.total}</span>
                            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textAlign: "center" }}>{statusLabel(o.status)}</span>
                            <span style={{ fontSize: 12, color: "var(--warm-gray)", textAlign: "right" }}>{new Date(o.created_at).toLocaleDateString("zh-TW")}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Products Tab ─── */}
            {tab === "products" && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                  <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>商品管理</h1>
                    <p style={{ fontSize: 13, color: "var(--warm-gray)" }}>共 {products.length} 項商品</p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋商品名稱..."
                      style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans TC'", width: 200, background: "var(--card)" }} />
                    {products.some((p) => p.photo && p.photo.startsWith("data:")) && (
                      <button onClick={migratePhotos}
                        style={{ background: "var(--card)", color: "var(--forest)", border: "1px solid var(--forest)", padding: "10px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 600 }}>
                        圖片搬到 Storage
                      </button>
                    )}
                    <button onClick={() => setEditing({ name: "", price: 0, description: "", category: "", icon: "🍃", weight: "150g", stock: 0 })}
                      style={{ background: "var(--forest)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新增商品
                    </button>
                  </div>
                </div>

                {editing && <ProductForm product={editing} onSave={saveProduct} onCancel={() => setEditing(null)} />}

                <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "52px 1.1fr 0.7fr 1.3fr 70px 80px 70px 140px", gap: 12, padding: "12px 24px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--warm-gray)", fontWeight: 600, letterSpacing: 0.5 }}>
                    <span></span><span>商品</span><span>分類</span><span>說明</span><span>淨重</span><span>價格</span><span>庫存</span><span>操作</span>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center", color: "var(--warm-gray)" }}>沒有找到商品</div>
                  ) : filteredProducts.map((p, i) => (
                    <div key={p.id} style={{
                      display: "grid", gridTemplateColumns: "52px 1.1fr 0.7fr 1.3fr 70px 80px 70px 140px",
                      gap: 12, alignItems: "center", padding: "16px 24px",
                      borderBottom: "1px solid var(--border)",
                      animation: `slideUp 0.3s ease ${i * 0.04}s both`, transition: "background 0.15s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.01)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, overflow: "hidden" }}>
                        {p.photo ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.icon}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{p.name}</div>
                      <span style={{ fontSize: 12, color: "var(--warm-gray)", background: "var(--bg)", padding: "4px 10px", borderRadius: 6, display: "inline-block", width: "fit-content" }}>{p.category}</span>
                      <span style={{ fontSize: 12, color: "var(--warm-gray)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</span>
                      <span style={{ fontSize: 12, color: "var(--warm-gray)" }}>{p.weight}</span>
                      <span className="serif" style={{ fontWeight: 700, color: "var(--gold-dark)", fontSize: 14 }}>NT${p.price}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: (p.stock || 0) > 10 ? "var(--success)" : (p.stock || 0) > 0 ? "var(--warning)" : "var(--error)" }}>
                        {(p.stock || 0) > 0 ? `${p.stock} 件` : "售完"}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditing(p)} style={{ padding: "6px 16px", border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, cursor: "pointer", borderRadius: 6, fontFamily: "'Noto Sans TC'", fontWeight: 500, transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.target.style.borderColor = "var(--gold)"; e.target.style.color = "var(--gold)"; }}
                          onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--ink)"; }}
                        >編輯</button>
                        <button onClick={() => setConfirmDelete(p)} style={{ padding: "6px 16px", border: "1px solid var(--border)", background: "var(--card)", fontSize: 12, cursor: "pointer", borderRadius: 6, fontFamily: "'Noto Sans TC'", color: "var(--warm-gray)", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.target.style.borderColor = "var(--error)"; e.target.style.color = "var(--error)"; }}
                          onMouseLeave={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--warm-gray)"; }}
                        >刪除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Orders Tab ─── */}
            {tab === "orders" && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                  <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>訂單管理</h1>
                    <p style={{ fontSize: 13, color: "var(--warm-gray)" }}>共 {orders.length} 筆訂單</p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋姓名或電話..."
                      style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "'Noto Sans TC'", width: 200, background: "var(--card)" }} />
                    <button onClick={init} style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 500 }}>重新載入</button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                  {[
                    { key: "all",        label: "全部",   count: orders.length },
                    { key: "pending",    label: "待處理", count: orders.filter((o) => o.status === "pending").length },
                    { key: "processing", label: "處理中", count: orders.filter((o) => o.status === "processing").length },
                    { key: "shipped",    label: "已出貨", count: orders.filter((o) => o.status === "shipped").length },
                    { key: "completed",  label: "已完成", count: orders.filter((o) => o.status === "completed").length },
                    { key: "cancelled",  label: "已取消", count: orders.filter((o) => o.status === "cancelled").length },
                  ].map((f) => (
                    <button key={f.key} onClick={() => setOrderFilter(f.key)} style={{
                      padding: "7px 16px", border: "1px solid var(--border)", borderRadius: 20,
                      background: orderFilter === f.key ? "var(--forest)" : "var(--card)",
                      color: orderFilter === f.key ? "#fff" : "var(--ink)",
                      fontSize: 12, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 500, transition: "all 0.2s",
                    }}>{f.label} ({f.count})</button>
                  ))}
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 60, textAlign: "center", color: "var(--warm-gray)" }}>沒有找到訂單</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredOrders.map((o, i) => {
                      let items = [];
                      try {
                        items = typeof o.items === "string" ? JSON.parse(o.items) : (o.items || []);
                      } catch { items = []; }
                      const sc = statusColor(o.status);
                      return (
                        <div key={o.id} style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", animation: `slideUp 0.3s ease ${i * 0.04}s both` }}>
                          <div style={{ padding: "20px 24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                                  <span style={{ fontSize: 18, fontWeight: 700 }}>{o.customer_name}</span>
                                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{statusLabel(o.status)}</span>
                                </div>
                                <div style={{ fontSize: 13, color: "var(--warm-gray)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                                  <span>📞 {o.customer_phone}</span>
                                  {o.customer_email && <span>✉️ {o.customer_email}</span>}
                                  <span>📍 {o.customer_address}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div className="serif" style={{ fontSize: 22, fontWeight: 700, color: "var(--gold-dark)" }}>NT${o.total}</div>
                                <div style={{ fontSize: 11, color: "var(--warm-gray)", marginTop: 4 }}>{new Date(o.created_at).toLocaleString("zh-TW")}</div>
                              </div>
                            </div>

                            <div style={{ background: "var(--bg)", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                              <div style={{ fontSize: 11, color: "var(--warm-gray)", marginBottom: 8, fontWeight: 600, letterSpacing: 0.5 }}>訂購商品</div>
                              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {items.map((item, j) => (
                                  <span key={j} style={{ fontSize: 13 }}>{item.name} × {item.qty} <span style={{ color: "var(--warm-gray)" }}>(NT${item.price * item.qty})</span></span>
                                ))}
                              </div>
                            </div>

                            {o.note && (
                              <div style={{ fontSize: 13, color: "var(--gold-dark)", marginBottom: 16, padding: "8px 12px", background: "var(--warning-bg)", borderRadius: 6, border: "1px solid #fde68a" }}>
                                💬 備註：{o.note}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, color: "var(--warm-gray)", lineHeight: "32px", marginRight: 4 }}>更新狀態：</span>
                              {["pending", "processing", "shipped", "completed", "cancelled"].map((s) => {
                                const c = statusColor(s);
                                const active = o.status === s;
                                return (
                                  <button key={s} onClick={() => updateOrderStatus(o.id, s)} disabled={active} style={{
                                    padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                    border: `1px solid ${active ? c.border : "var(--border)"}`,
                                    background: active ? c.bg : "var(--card)",
                                    color: active ? c.color : "var(--warm-gray)",
                                    cursor: active ? "default" : "pointer",
                                    fontFamily: "'Noto Sans TC'", transition: "all 0.15s", opacity: active ? 1 : 0.7,
                                  }}
                                    onMouseEnter={(e) => { if (!active) { e.target.style.opacity = "1"; e.target.style.borderColor = c.border; e.target.style.color = c.color; } }}
                                    onMouseLeave={(e) => { if (!active) { e.target.style.opacity = "0.7"; e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--warm-gray)"; } }}
                                  >{statusLabel(s)}</button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── Settings Tab ─── */}
            {tab === "settings" && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 28 }}>設定</h1>

                <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 28, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>資料庫連線</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: dbReady ? "#4ade80" : "#ef4444" }} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{dbReady ? "Supabase 已連線" : "尚未連線"}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--warm-gray)", lineHeight: 1.8, marginBottom: 16 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)" }}>API URL：</span>{SUPABASE_URL}
                  </div>
                  {!dbReady && (
                    <button onClick={initDB} style={{ background: "var(--gold)", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 600 }}>初始化資料庫</button>
                  )}
                </div>

                <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 28 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>資料庫建立 SQL</h3>
                  <p style={{ fontSize: 13, color: "var(--warm-gray)", marginBottom: 16, lineHeight: 1.8 }}>請在 Supabase SQL Editor 執行以下語句建立資料表，完成後點擊「初始化 DB」按鈕匯入預設商品。</p>
                  <pre style={{ background: "var(--bg)", padding: 20, borderRadius: 8, fontSize: 12, lineHeight: 1.8, overflowX: "auto", whiteSpace: "pre", border: "1px solid var(--border)", color: "var(--ink)" }}>
{`-- products 資料表
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  category TEXT,
  icon TEXT DEFAULT '🍃',
  weight TEXT DEFAULT '150g',
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- orders 資料表
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  note TEXT,
  total INTEGER,
  status TEXT DEFAULT 'pending',
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 開啟 RLS 並建立存取政策
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Public delete products" ON products FOR DELETE USING (true);

CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);`}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Product Form ───
function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState({ ...product });
  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--border)", fontSize: 13, fontFamily: "'Noto Sans TC', sans-serif", background: "#fff", borderRadius: 6 };
  const labelStyle = { fontSize: 11, color: "var(--warm-gray)", marginBottom: 4, display: "block", letterSpacing: 0.5, fontWeight: 600 };

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadPhoto(file);
      setForm((f) => ({ ...f, photo: url }));
    } catch (err) {
      setUploadError("圖片上傳失敗，請確認 Supabase Storage 已建立 product-photos bucket 並設定權限");
    }
    setUploading(false);
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 12, border: "2px solid var(--gold-light)", padding: 28, marginBottom: 24, animation: "slideDown 0.3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>{product.id ? "編輯商品" : "新增商品"}</h3>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--warm-gray)", padding: 4 }}>✕</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>商品圖片</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 88, height: 88, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {form.photo ? <img src={form.photo} alt="預覽" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32 }}>{form.icon || "🍃"}</span>}
          </div>
          <div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: 13, fontFamily: "'Noto Sans TC', sans-serif" }} />
            {uploading && <div style={{ fontSize: 12, color: "var(--warm-gray)", marginTop: 6 }}>上傳中…</div>}
            {uploadError && <div style={{ fontSize: 12, color: "var(--error)", marginTop: 6 }}>{uploadError}</div>}
            {form.photo && <button onClick={() => setForm((f) => ({ ...f, photo: "" }))} style={{ display: "block", marginTop: 8, background: "none", border: "none", color: "var(--error)", fontSize: 12, cursor: "pointer", padding: 0 }}>移除圖片</button>}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div><label style={labelStyle}>商品名稱 *</label><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：凍頂烏龍茶" /></div>
        <div><label style={labelStyle}>價格 (NT$) *</label><input style={inputStyle} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} /></div>
        <div><label style={labelStyle}>分類</label><input style={inputStyle} value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="烏龍茶 / 紅茶 / 高山茶" /></div>
        <div><label style={labelStyle}>淨重</label><input style={inputStyle} value={form.weight || ""} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="150g" /></div>
        <div><label style={labelStyle}>庫存數量</label><input style={inputStyle} type="number" value={form.stock || 0} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} /></div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>商品說明</label>
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="詳細的商品介紹…" />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button disabled={uploading} onClick={() => onSave(form)} style={{ background: "var(--forest)", color: "#fff", border: "none", padding: "10px 36px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'", fontWeight: 600 }}>儲存</button>
        <button onClick={onCancel} style={{ background: "var(--card)", color: "var(--warm-gray)", border: "1px solid var(--border)", padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'Noto Sans TC'" }}>取消</button>
      </div>
    </div>
  );
}
