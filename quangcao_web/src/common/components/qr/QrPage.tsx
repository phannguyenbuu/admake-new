import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "react-router-dom";
import { useApiHost } from "../../common/hooks/useApiHost";

function QrPage() {
  const API_HOST = useApiHost();

  // Lấy tham số động từ URL /qr/:name/:description
  const { name, description } = useParams<{ name: string; description: string }>();

  const [qrLink, setQrLink] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function createWithParams() {
      // Không có name hoặc description thì báo lỗi
      if (!name || !description) {
        setError("Missing name or description in URL");
        return;
      }
      setError("");

      try {
        const resCustomer = await fetch(`${API_HOST}/customer/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: name, workAddress:description }),
        });
        if (!resCustomer.ok) {
          const err = await resCustomer.text();
          setError(`Create customer failed: ${err}`);
          return;
        }
        const customerData = await resCustomer.json();
        const userId = customerData.id;

        const groupPayload = {
          id: userId,
          name: name + "_CHAT",
          description,
        };

        const resGroup = await fetch(`${API_HOST}/group/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupPayload),
        });
        if (!resGroup.ok) {
          const err = await resGroup.text();
          setError(`Create group failed: ${err}`);
          return;
        }

        const url = `${window.location.origin}/invite/${encodeURIComponent(
          name
        )}&desc=${encodeURIComponent(description)}`;
        setQrLink(url);
      } catch (e) {
        setError("Unexpected error: " + (e instanceof Error ? e.message : ""));
      }
    }

    createWithParams();
  }, [API_HOST, name, description]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Customer & Generate QR Code</h2>
      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      {qrLink && (
        <div style={{ marginTop: 20 }}>
          <p>Scan QR code to access the link:</p>
          <QRCodeSVG value={qrLink} size={200} />
          <p>
            <a href={qrLink} target="_blank" rel="noreferrer">
              {qrLink}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default QrPage;
