import { Button } from "antd";
import { useState } from "react";
import { HolidayManagerment } from "./HolidayManagerment";
import type { HolidayModalProps } from "../../../@types/holiday.type";
import type { User } from "../../../@types/user.type";

export default function HolidayButton({
  user,
}: Pick<HolidayModalProps, "user">) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Button
        type="primary"
        className="!font-semibold !text-base !bg-[#00B4B6] !transition-all !duration-300 !shadow-md hover:!scale-105 focus:!shadow-md active:!shadow-md"
        onClick={handleOpenModal}
      >
        Quản lý nghỉ phép
      </Button>

      <HolidayManagerment
        user={user as User}
        open={modalOpen}
        onCancel={handleCloseModal}
      />
    </>
  );
}
