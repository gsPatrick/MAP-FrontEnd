// src/pages/AdminPage/components/QuickActionsTab.jsx
import React, { useState } from 'react';
import { Card, Button, Row, Col } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import CreateUserModal from './CreateUserModal';

const QuickActionsTab = () => {
    const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);

    return (
        <>
            <Card title="Ações Rápidas">
                <Row>
                    <Col>
                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => setIsCreateUserModalVisible(true)}
                        >
                            Criar Novo Usuário
                        </Button>
                    </Col>
                </Row>
            </Card>
            <CreateUserModal
                visible={isCreateUserModalVisible}
                onClose={() => setIsCreateUserModalVisible(false)}
                onSuccess={() => {
                    setIsCreateUserModalVisible(false);
                    // Aqui você poderia usar um context ou callback para atualizar a lista principal,
                    // mas por enquanto, o usuário pode navegar para a aba e atualizar.
                }}
            />
        </>
    );
};

export default QuickActionsTab;