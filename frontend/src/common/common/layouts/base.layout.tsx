import { ConfigProvider, Layout } from "antd";
import { Outlet } from "react-router-dom";
import "./css.css";
import vi_VN from "antd/locale/vi_VN";

export default function BaseLayout() {
  return (
    <div className="min-h-screen">
      <ConfigProvider locale={vi_VN}>
        <Layout className="!bg-fixed !bg-center !bg-cover !rounded-2xl">
          <Layout.Content>
            <Outlet />
          </Layout.Content>
        </Layout>
      </ConfigProvider>
    </div>
  );
}
