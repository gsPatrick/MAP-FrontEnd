// src/components/CustomModal/CustomModal.jsx
import React from 'react';
import { Modal, Button, Typography } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './CustomModal.css';

const { Title, Paragraph } = Typography;

const icons = {
  error: <ExclamationCircleOutlined className="modal-icon error" />,
  success: <CheckCircleOutlined className="modal-icon success" />,
  info: <InfoCircleOutlined className="modal-icon info" />,
  warning: <ExclamationCircleOutlined className="modal-icon warning" />,
};

const CustomModal = ({
  visible,
  onClose,
  onOk,
  title,
  message,
  okText = "OK",
  cancelText,
  type = "info" // 'info', 'error', 'success', 'warning'
}) => {
  const modalIcon = icons[type] || icons.info;

  const footerButtons = [];
  if (cancelText) {
    footerButtons.push(
      <Button key="back" onClick={onClose}>
        {cancelText}
      </Button>
    );
  }
  footerButtons.push(
    <Button key="submit" type="primary" onClick={onOk || onClose}>
      {okText}
    </Button>
  );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={footerButtons}
      centered
      closable={false}
      maskClosable={true}
      className="custom-modal-container"
    >
      <div className="custom-modal-content">
        {modalIcon}
        <Title level={4} className="custom-modal-title">{title}</Title>
        <Paragraph className="custom-modal-message">{message}</Paragraph>
      </div>
    </Modal>
  );
};

export default CustomModal;