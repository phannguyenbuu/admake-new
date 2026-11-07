import { Modal } from "antd";
import { ProductBomQuote } from "../product-bom/ProductBomQuote";

export function AIAssistantModal({ open, onCancel }: { open: boolean; onCancel: () => void }) {
  return <Modal open={open} onCancel={onCancel} footer={null} width="95vw" title="BOM & Báo giá" centered
    styles={{ body: { height: "84vh", overflowY: "auto" } }} destroyOnClose>
    <ProductBomQuote />
  </Modal>;
}
