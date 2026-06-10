document.addEventListener("DOMContentLoaded", () => {

    const inputBusca = document.getElementById('search-input');
    const btnBuscar = document.getElementById('btn-buscar');

    function dispararBuscaInterna() {
        const termo = inputBusca.value.trim();
        if (termo === "") {
            alert("Digite algo para buscar!");
            return;
        }
        window.location.href = `index.html?search=${encodeURIComponent(termo)}`;
    }

    if (btnBuscar && inputBusca) {
        btnBuscar.addEventListener('click', dispararBuscaInterna);
        inputBusca.addEventListener('keypress', (e) => { if (e.key === 'Enter') dispararBuscaInterna(); });
    }

    // Configurar navegação imediatamente
    const navHome = document.getElementById('nav-home');
    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    document.querySelectorAll('.nav-cat-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-cat');
            if (cat === "TODAS") {
                window.location.href = 'index.html?view=todas';
            } else if (cat === "CATEGORIAS") {
                window.location.href = 'index.html?view=categorias';
            } else {
                window.location.href = `index.html?cat=${encodeURIComponent(cat)}`;
            }
        });
    });  
    const params = new URLSearchParams(window.location.search);
    const idSolicitado = parseInt(params.get('id')) || 1;

    fetch('receitas.json')
    .then(res => res.json())
    .then(banco => {
        const receita = banco.find(r => r.id === idSolicitado);

        if (!receita) {
            document.getElementById('rec-titulo').innerText = "Receita não encontrada!";
            return;
        }

        document.getElementById('bread-categoria').innerText = receita.categoria;
        document.getElementById('bread-titulo').innerText = receita.titulo;
        document.getElementById('rec-categoria').innerText = receita.categoria;
        document.getElementById('rec-titulo').innerText = receita.titulo;
        document.getElementById('rec-desc').innerText = receita.desc;
        document.getElementById('rec-imagem').src = receita.imagem;
        document.getElementById('rec-preparo').innerText = receita.tempo_preparo;

        document.getElementById('rec-rendimento').innerText = receita.rendimento;
        document.getElementById('rec-dificuldade').innerText = receita.dificuldade;
        document.getElementById('rec-dica').innerText = receita.dica_chef;
        document.getElementById('nutr-cal').innerText = receita.calorias;
        document.getElementById('nutr-prot').innerText = receita.proteinas;
        document.getElementById('nutr-carb').innerText = receita.carboidratos;
        document.getElementById('nutr-gord').innerText = receita.gorduras;

        const normalizarLista = (valor) => {
            if (Array.isArray(valor)) return valor;
            if (valor && typeof valor === 'object') {
                return Object.keys(valor)
                    .sort((a, b) => Number(a) - Number(b))
                    .map(k => valor[k]);
            }
            return [];
        };
        const ingUl = document.getElementById('rec-ingredientes');
        ingUl.innerHTML = "";
        const ingredientesNormalizados = normalizarLista(receita.ingredientes);
        ingredientesNormalizados.forEach(ing => {
            const li = document.createElement('li');
            li.innerText = ing;
            ingUl.appendChild(li);
        });

        const prepOl = document.getElementById('rec-preparo-passos');
        prepOl.innerHTML = "";
        const preparoNormalizado = normalizarLista(receita.modo_preparo);
        preparoNormalizado.forEach(passo => {
            const li = document.createElement('li');
            li.innerText = passo;
            prepOl.appendChild(li);
        });

        const totalEstrelas = receita.total_estrelas || 0;
        const totalVotos = receita.total_votos || 0;
        
        const mediaExibicao = totalVotos > 0 ? (totalEstrelas / totalVotos).toFixed(1) : 0;
        const mediaArredondada = totalVotos > 0 ? Math.round(totalEstrelas / totalVotos) : 0;

        const ratingText = document.getElementById('rating-text');
        ratingText.innerText = totalVotos > 0 ? `${mediaExibicao} de 5 (${totalVotos} avaliações)` : "Seja o primeiro a avaliar";

        const stars = document.querySelectorAll('#stars span');
        
        stars.forEach(star => {
            if (parseInt(star.dataset.star) <= mediaArredondada) {
                star.classList.add('active');
            }
        });

        const jaAvaliou = localStorage.getItem(`avaliou_${receita.id}`);

        if (jaAvaliou) {
            ratingText.innerText += " • Você já avaliou";
            stars.forEach(star => star.style.cursor = 'default');
            return;
        }

        stars.forEach(star => {
            star.addEventListener('click', async () => {
                const nota = parseInt(star.dataset.star);
                
                stars.forEach(s => {
                    if (parseInt(s.dataset.star) <= nota) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });

                const formData = new FormData();
                formData.append('id', receita.id);
                formData.append('nota', nota);

                try {
                    const resposta = await fetch('avaliar.php', {
                        method: 'POST',
                        body: formData
                    });

                    const resultado = await resposta.json();

                    if (resultado.status === 'sucesso') {
                        localStorage.setItem(`avaliou_${receita.id}`, true);
                        alert('Avaliação registrada com sucesso!');
                        location.reload();
                    }
                } catch (erro) {
                    console.error(erro);
                    alert('Erro ao registrar avaliação.');
                }
            });
        });

    })
    .catch(err => {
        console.error("Erro ao carregar detalhes:", err);
    });
});