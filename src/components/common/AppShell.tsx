import { Compass, Home, Search, Sprout, UserRound } from "lucide-react";
import type { CSSProperties } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "今日任务", shortLabel: "今天", icon: Home, accent: "#2563eb" },
  { to: "/map", label: "学习路线", shortLabel: "学习", icon: Compass, accent: "#7c3aed" },
  { to: "/review", label: "记忆复习", shortLabel: "复习", icon: Sprout, accent: "#00a6a6" },
  { to: "/discover", label: "内容探索", shortLabel: "发现", icon: Search, accent: "#e8790c" },
  { to: "/profile", label: "学习档案", shortLabel: "我的", icon: UserRound, accent: "#e5484d" }
];

const navAccent = (accent: string) => ({ "--nav-accent": accent }) as CSSProperties;

export function AppShell() {
  return (
    <div className="app-shell english-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="英语星球首页">
          <span className="brand-mark" aria-hidden="true">EN</span>
          <span className="brand-copy">
            <strong>英语星球</strong>
            <small>English Learning Desk</small>
          </span>
        </NavLink>
        <nav className="desktop-nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-link" style={navAccent(item.accent)}>
              <item.icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mode-indicator" aria-label="当前学习模式">
          <span aria-hidden="true" />
          Focus mode
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="移动端主导航">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link" style={navAccent(item.accent)}>
            <item.icon size={20} aria-hidden="true" />
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
