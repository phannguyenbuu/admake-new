import { Button, Result } from 'antd';
export default function Error500() {
  return (
     <Result
    status="500"
    title="500"
    subTitle="Xin lỗi! Đã xảy ra lỗi máy chủ."
    extra={<Button type="primary">Về trang chủ</Button>}
  />
  );
}
// This component is used to display a 500 error page in a React application.