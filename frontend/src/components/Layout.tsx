import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./Icon";

import {ensureStudent} from '../lib/student-session';
import {isStatic} from '../lib/runtime';

const nav: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "知识图谱", icon: "map" },
  { to: "/practice", label: "自主练习", icon: "book" },
  { to: "/test", label: "正式测试", icon: "edit" },
  ...(isStatic?[{to:'/mistakes',label:'我的错题',icon:'layers' as IconName}]:[]),
];
export function Layout() {
  const { pathname } = useLocation();
  const [identityError,setIdentityError]=useState('');
  useEffect(()=>{let active=true;ensureStudent().catch(e=>{if(active)setIdentityError(e.message);});return()=>{active=false;};},[]);
  useEffect(() => {
    document.body.classList.toggle("graph-page-active", pathname === "/");
    document.getElementById("main")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    return () => document.body.classList.remove("graph-page-active");
  }, [pathname]);
  return (
    <div
      className={pathname === "/" ? "app-layout graph-layout" : "app-layout"}
    >
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="定位方法知识图谱首页">
            <span className="brand-symbol">
              <Icon name="target" size={27} />
            </span>
            <span>
              <strong>定位方法</strong>
              <small>物联网与云计算 · 互动学习</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="主导航">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}>
                <Icon name={item.icon} size={19} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="student-label">
            <Icon name="user" size={18} />
            <span>匿名学习</span>
          </span>
        </div>
      </header>
      <div className="demo-strip">
        <div>
          <span className="demo-tag">匿名学习</span>
          <span>{isStatic?'记录仅保存在本浏览器 · 清理网站数据会丢失':'练习巩固知识 · 正式测试更新累计评价'}</span>
        </div>
      </div>
      {identityError&&<div className="identity-error" role="alert">{identityError}<button onClick={()=>ensureStudent().then(()=>setIdentityError('')).catch(e=>setIdentityError(e.message))}>重试</button></div>}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>《物联网与云计算》· 定位方法</span>
        <span>
          课堂学习 <span className="footer-dot">·</span>{" "}
          教材学习与自我测评
        </span>
      </footer>
      <nav className="mobile-nav" style={{gridTemplateColumns:`repeat(${nav.length},minmax(0,1fr))`}} aria-label="手机导航">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            <Icon name={item.icon} size={21} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
