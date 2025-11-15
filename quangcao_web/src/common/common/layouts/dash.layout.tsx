import React from "react";
import { Layout } from "antd";
import AppHeader from "./base/AppHeader";
import { Outlet } from "react-router-dom";
import RenderMenuBar from "../../../dashboard/menu/RenderMenuBar";
import { UpdateButtonProvider } from "../hooks/useUpdateButtonTask";

const { Sider, Content } = Layout;
export default function DashLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  // Responsive: Collapse sidebar trên mobile
  React.useEffect(() => {
    const resize = () => {
      setCollapsed(window.innerWidth < 1024);
      setIsMobile(window.innerWidth < 768);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Xóa buildMenu và select vì không dùng
  return (
    <Layout
      className=""
      style={{
        backgroundImage: "url(/backGround.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: 'pointer',
      }}

      
    >

      <UpdateButtonProvider>
        <AppHeader />
        <Layout hasSider className="">
          {!isMobile && (
            <Sider
              width={280}
              collapsedWidth={64}
              collapsible
              collapsed={collapsed}
              onCollapse={setCollapsed}
              style={{
                background: "#00B4B6",
                boxShadow: "2px 0 8px rgba(0, 180, 182, 0.15)",
                border: "none",
                padding: "0",
                height: "calc(100vh - 66px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                zIndex: 10,
                // opacity: 0.95,
                position: "fixed",
                left: 0,
                top: 66,
                bottom: 0,
                overflow: "hidden",
              }}
              // chuyển mấy cái style thành className
              className="!fixed !left-0 !top-[66px] !bottom-0 !z-10 !opacity-90"
              trigger={null}
            >
              <div className="py-4 px-2" />
              {/* Custom render menu động - chỉ cho desktop */}
              <div className="flex-1 overflow-y-auto">
                <RenderMenuBar />
              </div>
            </Sider>
          )}
          {/* Main content */}
          <Layout className="bg-transparent flex flex-col !min-h-[calc(100vh-72px)]">
            <Content
              className={`flex flex-col md:px-2 min-h-full ${
                isMobile ? "pb-20" : ""
              }`}
              style={{
                marginLeft:
                  !isMobile && !collapsed
                    ? "280px"
                    : !isMobile && collapsed
                    ? "64px"
                    : "0",
                transition: "margin-left 0.2s ease",
              }}
            >
              <div className=" px-6 pt-2">{}</div>
              <div className="w-full h-full">
                <div className=" rounded-2xl min-h-[300px] h-full">
                  <Outlet />
                </div>
              </div>
            </Content>
          </Layout>
        </Layout>

        {/* Mobile Menu - Luôn hiển thị ở dưới cùng cho mobile */}
        {isMobile && <RenderMenuBar />}

        </UpdateButtonProvider>
    </Layout>
  );
}
