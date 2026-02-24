// d:/daniatualagrvai/MAP-FrontEnd/src/components/Support/SupportFloatingButton.jsx
import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { QuestionOutlined } from '@ant-design/icons';
import SupportTicketModal from './SupportTicketModal';
import './SupportFloatingButton.css';

const SupportFloatingButton = () => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <>
            <div className="support-floating-wrapper">
                <Tooltip title="Preciso de Ajuda" placement="left">
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<QuestionOutlined />}
                        className="support-floating-btn"
                        onClick={() => setModalVisible(true)}
                    />
                </Tooltip>
            </div>

            <SupportTicketModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
            />
        </>
    );
};

export default SupportFloatingButton;
