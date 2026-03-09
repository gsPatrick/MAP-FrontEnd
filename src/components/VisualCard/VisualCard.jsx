import React from 'react';
import { Avatar } from 'antd';
import { CreditCardOutlined, ScanOutlined } from '@ant-design/icons';
import './VisualCard.css';

const VisualCard = ({ card, currentProfile, scale = 1, showDetails = true }) => {
    if (!card) return null;

    const color = card.dominantColor || '#6A0DAD';
    const lastFour = card.lastFourDigits || card.numeroCartao || '••••';
    const icon = card.flagIconUrl || card.iconeBandeira;

    return (
        <div
            className={`virtual-card-premium ${showDetails ? 'with-details' : 'compact'}`}
            style={{
                '--card-gradient': color,
                transform: `scale(${scale})`,
                transformOrigin: 'center center'
            }}
        >
            <div className="card-glass-overlay"></div>
            <div className="card-content-top">
                <div className="card-brand-section">
                    <Avatar size={48 * scale} src={icon} icon={<CreditCardOutlined />} className="card-flag-img" />
                    {card.name && <span className="card-type-name" style={{ fontSize: 12 * scale }}>{card.name}</span>}
                </div>
                <div className="card-chip-container" style={{ gap: 12 * scale }}>
                    <div className="card-chip-sim" style={{ width: 40 * scale, height: 30 * scale }}></div>
                    <ScanOutlined className="nfc-icon" style={{ fontSize: 24 * scale }} />
                </div>
            </div>
            <div className="card-number-display" style={{ fontSize: showDetails ? 22 * scale : 18 * scale, opacity: showDetails ? 1 : 0.8, letterSpacing: 2 * scale }}>
                •••• •••• •••• {lastFour}
            </div>
            {(showDetails || true) && (
                <div className="card-footer-info" style={{ opacity: showDetails ? 1 : 0 }}>
                    <div className="card-holder">
                        <span className="label" style={{ fontSize: 9 * scale }}>PORTADOR</span>
                        <span className="value" style={{ fontSize: 13 * scale }}>{(currentProfile?.ownerClientName || currentProfile?.name || 'CLIENTE MAP').toUpperCase()}</span>
                    </div>
                    <div className="card-expiry">
                        <span className="label" style={{ fontSize: 9 * scale }}>VALIDADE</span>
                        <span className="value" style={{ fontSize: 13 * scale }}>12/29</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualCard;
