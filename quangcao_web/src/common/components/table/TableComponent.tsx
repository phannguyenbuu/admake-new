import { Table } from "antd";
import type { TableProps } from "antd/es/table";
import { useStyle } from "../../common/hooks/styles.hook";

export default function TableComponents<T>({ ...props }: TableProps<T>) {
  const { styles } = useStyle();
  
  return (
    <div>
      <div className="bg-white/90 rounded-xl shadow-lg overflow-x-auto">
        <Table<T>
          className={styles.customTable}
          pagination={false}
          bordered={false}
          rowClassName="!text-base !text-gray-800"
          rowKey="id"
          scroll={{ x: "max-content" }}
          {...props}
        />
      </div>
    </div>
  );
}
