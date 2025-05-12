document.addEventListener('DOMContentLoaded', function () {
    const quizCodeInput = document.getElementById('quiz-code');
    const searchBtn = document.getElementById('search-btn');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const errorMessage = document.getElementById('error-message');
    const resultsList = document.getElementById('results-list');
    const searchInput = document.getElementById('search-input');
    const donationPopup = document.getElementById('donation-popup');
    const closeBtn = document.querySelector('.close-btn');
    const successMessage = document.querySelector('.success-message');
    const pasteBtn = document.getElementById('paste-btn');
    const copyAllBtn = document.getElementById('copy-all-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Função para buscar as respostas da API
    function fetchQuizAnswers(quizCode) {
        if (!quizCode) {
            showError("Por favor, insira um código de quiz válido.");
            return;
        }

        loading.style.display = 'block';
        resultsContainer.style.display = 'none';
        errorMessage.style.display = 'none';

        fetch('https://quizzizapi.squareweb.app/quizizz-answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: quizCode })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().catch(() => null).then(errorBody => {
                    const errorMsg = errorBody?.message || `Erro na requisição: ${response.status} ${response.statusText}`;
                    throw new Error(errorMsg);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.message || 'Erro ao buscar as respostas.');
            }
            if (data.correctAnswers && Array.isArray(data.correctAnswers)) {
                displayResults(data.correctAnswers);
            } else {
                throw new Error('Formato de resposta inesperado da API.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            showError(`Erro ao buscar as respostas: ${error.message}`);
        })
        .finally(() => {
            loading.style.display = 'none';
        });
    }

    // Função para exibir os resultados
    function displayResults(answers) {
        resultsList.innerHTML = '';
        searchInput.value = '';

        if (answers && answers.length > 0) {
            answers.forEach((item, index) => {
                const questionCard = document.createElement('div');
                questionCard.className = 'question-card';
                questionCard.style.animationDelay = `${index * 100}ms`;
                
                const questionText = stripHtmlTags(item.question || 'Pergunta não disponível');
                const answerText = stripHtmlTags(item.answer || 'Resposta não disponível');
                
                questionCard.innerHTML = `
                    <div class="question-text">${questionText}</div>
                    <div class="answer-wrapper">
                        <div class="correct-marker"><i class="fa-solid fa-check"></i></div>
                        <div class="correct-answer">${answerText}</div>
                        <button class="copy-btn" data-question="${escapeHtml(questionText)}" data-answer="${escapeHtml(answerText)}" title="Copiar pergunta e resposta">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                    </div>
                `;
                resultsList.appendChild(questionCard);
                
                // Animação de entrada
                setTimeout(() => {
                    questionCard.style.opacity = '1';
                    questionCard.style.transform = 'translateY(0)';
                }, 50 + index * 100);
            });
            
            resultsContainer.style.display = 'block';
            updateFilterMessage(answers.length, answers.length);
        } else {
            showError('Nenhuma resposta encontrada para este quiz.');
        }
    }

    // Função para remover tags HTML
    function stripHtmlTags(html) {
        if (typeof html !== 'string') return html;
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    // Função para escapar HTML para uso em atributos
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Função para exibir mensagens de erro
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        resultsContainer.style.display = 'none';
    }

    // Função para atualizar a mensagem de contagem do filtro
    function updateFilterMessage(visibleCount, totalCount) {
        if (successMessage) {
            if (visibleCount === totalCount) {
                successMessage.textContent = `Mostrando todas as ${totalCount} respostas.`;
            } else {
                successMessage.textContent = `Mostrando ${visibleCount} de ${totalCount} respostas.`;
            }
        }
    }

    // Função para filtrar as respostas
    function filterAnswers(searchTerm) {
        const questionCards = document.querySelectorAll('#results-list .question-card');
        let visibleCount = 0;
        const searchText = searchTerm.toLowerCase().trim();
        
        questionCards.forEach(card => {
            const questionText = card.querySelector('.question-text').textContent.toLowerCase();
            const answerText = card.querySelector('.correct-answer').textContent.toLowerCase();
            
            if (questionText.includes(searchText) || answerText.includes(searchText)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        updateFilterMessage(visibleCount, questionCards.length);
    }

    // Função para mostrar toast de notificação
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Função para copiar texto para a área de transferência
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar: ', err);
            showToast('Erro ao copiar texto');
        });
    }

    // Função para formatar texto para WhatsApp
    function formatForWhatsApp(questions) {
        let formattedText = '';
        
        questions.forEach((item, index) => {
            formattedText += `Pergunta ${index + 1}: ${item.question}\n`;
            formattedText += `Resposta: *${item.answer}*\n\n`;
        });
        
        return formattedText;
    }

    // Função para coletar todas as perguntas e respostas visíveis
    function getAllVisibleQuestionsAndAnswers() {
        const questionCards = document.querySelectorAll('#results-list .question-card');
        const questions = [];
        
        questionCards.forEach((card, index) => {
            if (card.style.display !== 'none') {
                const question = card.querySelector('.question-text').textContent;
                const answer = card.querySelector('.correct-answer').textContent;
                
                questions.push({
                    question: question,
                    answer: answer
                });
            }
        });
        
        return questions;
    }

    // --- Event Listeners ---
    
    // Buscar respostas ao clicar no botão
    searchBtn.addEventListener('click', function () {
        const quizCode = quizCodeInput.value.trim();
        fetchQuizAnswers(quizCode);
    });
    
    // Buscar respostas ao pressionar Enter
    quizCodeInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const quizCode = quizCodeInput.value.trim();
            fetchQuizAnswers(quizCode);
        }
    });
    
    // Filtrar respostas ao digitar
    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value;
        filterAnswers(searchTerm);
    });

    // Colar da área de transferência
    pasteBtn.addEventListener('click', function() {
        navigator.clipboard.readText()
            .then(text => {
                quizCodeInput.value = text.trim();
            })
            .catch(err => {
                console.error('Erro ao acessar a área de transferência: ', err);
                showToast('Não foi possível acessar a área de transferência');
            });
    });

    // Copiar todas as perguntas e respostas
    copyAllBtn.addEventListener('click', function() {
        const questions = getAllVisibleQuestionsAndAnswers();
        if (questions.length > 0) {
            const formattedText = formatForWhatsApp(questions);
            copyToClipboard(formattedText);
        } else {
            showToast('Nenhuma pergunta para copiar');
        }
    });

    // Delegação de eventos para botões de cópia (para elementos dinâmicos)
    document.addEventListener('click', function(e) {
        // Copiar pergunta e resposta
        if (e.target.closest('.copy-btn')) {
            const btn = e.target.closest('.copy-btn');
            const question = btn.getAttribute('data-question');
            const answer = btn.getAttribute('data-answer');
            copyToClipboard(`Pergunta: ${question}\nResposta: *${answer}*`);
        }
    });

    // --- Pop-up de Info / Contato ---
    
    // Fechar o pop-up ao clicar no botão de fechar
    closeBtn.addEventListener('click', function () {
        donationPopup.style.display = 'none';
    });

    // Fechar o pop-up ao clicar fora do conteúdo
    donationPopup.addEventListener('click', function (event) {
        if (event.target === donationPopup) {
            donationPopup.style.display = 'none';
        }
    });

    // Abrir o pop-up de info ao clicar no link
    const infoLink = document.getElementById('info-link');
    if (infoLink) {
        infoLink.addEventListener('click', function (e) {
            e.preventDefault();
            donationPopup.style.display = 'flex';
        });
    }

    // Mostrar o pop-up após 2 segundos
    setTimeout(() => {
        if (donationPopup.style.display !== 'flex') {
            donationPopup.style.display = 'flex';
        }
    }, 2000);
});