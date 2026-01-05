import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    deleteDoc,
    orderBy,
    limit,
    serverTimestamp,
    writeBatch // Importante: Adicionado writeBatch
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db, auth } from '../firebase-config.js';

// Salvar progresso do usuário (Questão Resolvida)
export async function salvarProgresso(questaoId, acertou, respostaUsuario) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const progressoRef = doc(db, 'users', user.uid, 'progresso', questaoId);
        
        await setDoc(progressoRef, {
            questaoId: questaoId,
            acertou: acertou,
            respostaUsuario: respostaUsuario,
            dataResolucao: serverTimestamp(),
            revisar: !acertou // Se errou, marca para revisão automaticamente (opcional)
        }, { merge: true });

        // Atualizar estatísticas gerais do usuário (opcional, pode ser feito via Cloud Functions ou aqui)
        // Por simplicidade, vamos focar no registro da questão individual
        
    } catch (error) {
        console.error("Erro ao salvar progresso:", error);
        throw error;
    }
}

// Carregar progresso do usuário (Ids das questões resolvidas)
export async function carregarProgressoUsuario() {
    const user = auth.currentUser;
    if (!user) return {};

    try {
        const q = query(collection(db, 'users', user.uid, 'progresso'));
        const querySnapshot = await getDocs(q);
        
        const progresso = {};
        querySnapshot.forEach((doc) => {
            progresso[doc.id] = doc.data();
        });
        
        return progresso;
    } catch (error) {
        console.error("Erro ao carregar progresso:", error);
        return {};
    }
}

// Salvar um novo caderno
export async function salvarCaderno(nome, filtros, questoesIds) {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'cadernos'), {
            nome: nome,
            filtros: filtros, // Salva os filtros usados para referência
            questoes: questoesIds,
            dataCriacao: serverTimestamp(),
            ativo: true
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao criar caderno:", error);
        throw error;
    }
}

// Carregar cadernos do usuário
export async function carregarCadernos() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const q = query(
            collection(db, 'users', user.uid, 'cadernos'), 
            orderBy('dataCriacao', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const cadernos = [];
        querySnapshot.forEach((doc) => {
            cadernos.push({ id: doc.id, ...doc.data() });
        });
        
        return cadernos;
    } catch (error) {
        console.error("Erro ao carregar cadernos:", error);
        return [];
    }
}

export async function excluirCaderno(cadernoId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await deleteDoc(doc(db, 'users', user.uid, 'cadernos', cadernoId));
    } catch (error) {
        console.error("Erro ao excluir caderno:", error);
        throw error;
    }
}

// --- NOVA FUNÇÃO ---
// Remove o progresso de uma lista de questões (reseta o status para "não resolvida")
export async function resetarProgressoQuestoes(questoesIds) {
    const user = auth.currentUser;
    if (!user || !questoesIds || questoesIds.length === 0) return;

    try {
        const batch = writeBatch(db);
        
        // O Firestore limita batches a 500 operações. 
        // Se houver mais de 500 questões, idealmente dividiríamos em chunks.
        // Assumindo uso normal < 500 por caderno.
        questoesIds.forEach(id => {
            const docRef = doc(db, 'users', user.uid, 'progresso', id);
            batch.delete(docRef);
        });

        await batch.commit();
        console.log(`Progresso resetado para ${questoesIds.length} questões.`);
    } catch (error) {
        console.error("Erro ao resetar progresso das questões:", error);
        throw error;
    }
}
