import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG  } from 'qrcode.react';
import type { GroupProps } from '../../../@types/chat.type';
import { useApiHost } from '../../../common/hooks/useApiHost';
import { Dropdown, Avatar, Modal } from "antd";
import { ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { Flex } from 'antd';

interface RatingButtonsProps {
  // groupEl: GroupProps | null;
  url: string | null;
  title: string | null;
  filename: string | null;
}

const QRCode: React.FC<RatingButtonsProps> = ({ title, url, filename }) => {
  // const [qrContent, setQRContent] = useState<string | null>(null);
  // const [open, setOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDownloadPNG = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);

    // Tạo một URL data của SVG
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      // Tạo canvas cùng kích thước SVG
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Vẽ ảnh SVG vào canvas
      context.drawImage(image, 0, 0);

      // Tạo link download ảnh PNG từ canvas
      const pngUrl = canvas.toDataURL('image/png');

      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename || 'qr-code-admake.png';
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    };

    image.onerror = (err) => {
      console.error('Error loading SVG as image for PNG conversion', err);
    };

    image.src = url;
  };

  // useEffect(() => {
  //   setQRContent();
  // }, [groupEl]);

  return (
      <Stack direction="column" spacing={0} style={{ padding:20, flexDirection:'column'}}>
        <Stack direction="row" sx={{overflowX:'visible'}}>
          <DownloadIcon onClick={handleDownloadPNG} style={{width:40,height:40, color:'#0084a5ff', cursor:'pointer'}}/>  
          <p style={{whiteSpace:'normal',wordBreak: 'break-word',textAlign:'left',fontSize:10}}>{title}</p>
        </Stack>
        
        <QRCodeSVG value={url ?? ''} size={200} ref={svgRef} />
        <p style={{width:200, whiteSpace:'normal',wordBreak: 'break-word',textAlign:'left',fontSize:10}}>{url}</p>
                  
      </Stack>
      
  );
}

export default QRCode;