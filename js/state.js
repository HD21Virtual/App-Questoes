// Gerenciamento centralizado do estado da aplicação

export const state = {
    todasQuestoes: [],     // Todas as questões carregadas (do JSON/DB)
    questoesFiltradas: [], // Questões resultantes da busca/filtro atual
    questoesDoCaderno: [], // Questões do caderno atual selecionado
    
    // Estado de Progresso
    progressoUsuario: {}, // Mapa: { questaoId: { acertou: bool, ... } }
    
    // Estado da UI
    cadernoAtual: null,   // Objeto do caderno selecionado ou null (modo geral)
    indiceQuestaoAtual: 0,
    
    // Filtros Ativos
    filtros: {
        materia: null,
        assunto: null,
        textoBusca: '',
        apenasErros: false,
        apenasNaoRespondidas: false
    },

    // Métodos de manipulação
    setQuestoes(questoes) {
        this.todasQuestoes = questoes;
    },

    setProgresso(progresso) {
        this.progressoUsuario = progresso || {};
    },

    atualizarProgressoQuestao(questaoId, dados) {
        this.progressoUsuario[questaoId] = dados;
    },

    // --- NOVO MÉTODO ---
    // Remove questões específicas do progresso local
    resetarProgressoLocal(questoesIds) {
        if (!questoesIds || !Array.isArray(questoesIds)) return;
        
        questoesIds.forEach(id => {
            if (this.progressoUsuario[id]) {
                delete this.progressoUsuario[id];
            }
        });
    },

    getQuestaoAtual() {
        const lista = this.cadernoAtual ? this.questoesDoCaderno : this.questoesFiltradas;
        if (!lista || lista.length === 0) return null;
        return lista[this.indiceQuestaoAtual];
    },

    totalQuestoesAtuais() {
        const lista = this.cadernoAtual ? this.questoesDoCaderno : this.questoesFiltradas;
        return lista ? lista.length : 0;
    },

    // Verifica se a questão já foi respondida
    estaRespondida(questaoId) {
        return !!this.progressoUsuario[questaoId];
    },

    // Verifica se acertou a questão (se respondida)
    acertouQuestao(questaoId) {
        const p = this.progressoUsuario[questaoId];
        return p ? p.acertou : false;
    }
};
