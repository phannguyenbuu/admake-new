import React from "react";
import { Layout } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Outlet } from "react-router-dom";
import AppHeader from "./base/AppHeader";
import RenderMenuBar from "../../../dashboard/menu/RenderMenuBar";
import { UpdateButtonProvider } from "../hooks/useUpdateButtonTask";

const { Sider, Content } = Layout;

const SIDEBAR_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 40;

export default function DashLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const previousBelowDesktopRef = React.useRef<boolean | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const resize = () => {
      const nextIsMobile = window.innerWidth < 768;
      const nextBelowDesktop = window.innerWidth < 1024;

      setIsMobile(nextIsMobile);

      if (
        previousBelowDesktopRef.current === null ||
        previousBelowDesktopRef.current !== nextBelowDesktop
      ) {
        setCollapsed(nextBelowDesktop);
      }

      previousBelowDesktopRef.current = nextBelowDesktop;
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <Layout
      style={{
        backgroundImage: "url(/backGround.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: "pointer",
      }}
    >
      <UpdateButtonProvider>
        <AppHeader />

        <Layout hasSider>
          {!isMobile && (
            <Sider
              width={SIDEBAR_WIDTH}
              collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
              collapsed={collapsed}
              style={{
                background: "#00B4B6",
                boxShadow: "2px 0 8px rgba(0, 180, 182, 0.15)",
                border: "none",
                padding: "0",
                borderTopRightRadius: collapsed ? "16px" : "32px",
                borderBottomRightRadius: collapsed ? "16px" : "32px",
                height: "calc(100vh - 66px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                zIndex: 10,
                position: "fixed",
                left: 0,
                top: 66,
                bottom: 0,
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
              className="!fixed !left-0 !top-[66px] !bottom-0 !z-10 !opacity-90"
              trigger={null}
            >
              {collapsed ? (
                <div className="h-full w-full flex items-center justify-center">
                  <button
                    type="button"
                    aria-label="Mở menu"
                    onClick={toggleSidebar}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-white/20 hover:bg-white/35 text-white transition hover:scale-110 focus:outline-none cursor-pointer text-sm shadow-xs"
                    title="Mở menu (Mở rộng thanh bên)"
                  >
                    <RightOutlined />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto pb-4">
                    <RenderMenuBar />
                  </div>

                  <div className="mt-auto flex justify-end p-2.5">
                    <button
                      type="button"
                      aria-label="Thu gọn menu"
                      onClick={toggleSidebar}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/15 hover:bg-white/30 text-white transition hover:scale-105 focus:outline-none cursor-pointer text-base shadow-xs"
                      title="Thu gọn menu"
                    >
                      <LeftOutlined />
                    </button>
                  </div>
                </>
              )}
            </Sider>
          )}

          <Layout className="bg-transparent flex flex-col !min-h-[calc(100vh-72px)]">
            <Content
              className={`flex flex-col min-h-full md:px-2 ${isMobile ? "pb-20" : ""}`}
              style={{
                marginLeft:
                  !isMobile && !collapsed
                    ? `${SIDEBAR_WIDTH}px`
                    : !isMobile && collapsed
                      ? `${SIDEBAR_COLLAPSED_WIDTH}px`
                      : "0",
                transition: "margin-left 0.2s ease",
              }}
            >
              <div className="px-6 pt-2" />
              <div className="h-full w-full">
                <div className="h-full min-h-[300px] rounded-2xl">
                  <Outlet />
                </div>
              </div>
            </Content>
          </Layout>
        </Layout>

        {isMobile && <RenderMenuBar />}
      </UpdateButtonProvider>
    </Layout>
  );
}
