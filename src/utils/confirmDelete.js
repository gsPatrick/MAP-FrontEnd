// src/utils/confirmDelete.js
import { Modal } from 'antd';

/**
 * Modal de confirmação de exclusão PADRONIZADO e CENTRALIZADO.
 * Usado em todo o painel para que todos os botões de excluir tenham o mesmo
 * comportamento (modal no centro da tela, botão "Excluir" em vermelho).
 *
 * Ex.: confirmDelete({ content: 'Excluir este item?', onOk: () => handleDelete(id) })
 */
export default function confirmDelete({
  title = 'Confirmar exclusão',
  content = 'Tem certeza que deseja excluir? Esta ação não pode ser desfeita.',
  okText = 'Excluir',
  onOk,
}) {
  Modal.confirm({
    title,
    content,
    centered: true,
    okText,
    okButtonProps: { danger: true },
    cancelText: 'Cancelar',
    onOk,
  });
}
