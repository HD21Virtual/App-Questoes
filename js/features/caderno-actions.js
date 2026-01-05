import { salvarCaderno, carregarCadernos, excluirCaderno, resetarProgressoQuestoes } from '../services/firestore.js';
import { state } from '../state.js';
import { renderizarListaCadernos } from './caderno.js';
import { showToast, closeModal } from '../ui/ui-helpers.js';
import { dom } from '../dom-elements.js';

export function initCadernoActions() {
    // Botão de Criar Caderno (abre modal ou salva direto dependendo da UI)
    // Assumindo que existe um botão para "Salvar Seleção como Caderno" ou similar
    
    const btnCriarCaderno = document.getElementById('btn-criar-caderno-action'); 
    // Nota: O ID pode variar dependendo do seu HTML, ajuste conforme necessário. 
    // Baseado na lógica comum, vamos procurar onde o caderno é criado.
    
    // Se o modal de criar caderno tiver um form
    const formCriarCaderno = document.getElementById('form-criar-caderno');
    if (formCriarCaderno) {
        formCriarCaderno.addEventListener('submit', handleCriarCaderno);
    }
}

export async function handleCriarCaderno(nomeCaderno) {
    // Obter questões atuais filtradas
    const questoesParaSalvar = state.questoesFiltradas.map(q => q.id);

    if (questoesParaSalvar.length === 0) {
        showToast('Nenhuma questão selecionada para o caderno.', 'error');
        return;
    }

    if (!nomeCaderno || typeof nomeCaderno !== 'string') {
        // Se vier de um evento de submit direto
        const inputNome = document.getElementById('input-nome-caderno');
        if (inputNome) nomeCaderno = inputNome.value;
    }

    if (!nomeCaderno) {
        showToast('Por favor, dê um nome ao caderno.', 'warning');
        return;
    }

    try {
        // 1. Salvar o caderno no Firestore
        await salvarCaderno(nomeCaderno, state.filtros, questoesParaSalvar);
        
        // 2. --- LÓGICA DE RESET ---
        // Resetar o progresso (status de resolvida) dessas questões para que possam ser refeitas
        await resetarProgressoQuestoes(questoesParaSalvar);
        
        // 3. Atualizar o estado local para refletir o reset imediatamente na UI
        state.resetarProgressoLocal(questoesParaSalvar);

        showToast('Caderno criado e questões resetadas com sucesso!');
        
        // Fechar modal se existir
        closeModal('modal-criar-caderno');
        
        // Atualizar lista de cadernos na sidebar/menu
        const cadernos = await carregarCadernos();
        renderizarListaCadernos(cadernos);

        // Opcional: Recarregar a visualização atual para remover as cores verde/vermelho das questões
        // Como o state mudou, se o usuário navegar elas aparecerão em branco.
        
    } catch (error) {
        console.error(error);
        showToast('Erro ao criar caderno.', 'error');
    }
}

// Função auxiliar para vincular ao botão no HTML (se não usar form submit)
export function setupBotaoCriarCaderno() {
    const btnSalvar = document.getElementById('btn-salvar-caderno');
    const inputNome = document.getElementById('caderno-nome-input');
    
    if (btnSalvar && inputNome) {
        btnSalvar.addEventListener('click', async () => {
            const nome = inputNome.value;
            if(!nome) {
                showToast('Digite um nome para o caderno', 'warning');
                return;
            }
            await handleCriarCaderno(nome);
            inputNome.value = ''; // Limpar input
        });
    }
}
