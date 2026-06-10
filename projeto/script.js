document.addEventListener("DOMContentLoaded", () => {

    let bancoDeReceitasCompleto = [];
    const inputBusca = document.getElementById('search-input');
    const btnBuscar = document.getElementById('btn-buscar');

    fetch('receitas.json')
        .then(res => {
            if (!res.ok) throw new Error("Não foi possível carregar o arquivo receitas.json");
            return res.json();
        })
        .then(dados => {
            bancoDeReceitasCompleto = dados;
            navegarPelaUrlAtual();
        })
        .catch(err => {
            console.error("Erro ao carregar os dados:", err);
            document.getElementById('receitas-novas').innerHTML = 
                `<p style='grid-column: 1/-1; text-align:center; color:red;'>
                Erro ao carregar as receitas. Verifique se o arquivo receitas.json está na mesma pasta.
                </p>`;
        });
    function navegarPelaUrlAtual() {
        const params = new URLSearchParams(window.location.search);
        const acao = params.get('view');
        const categoria = params.get('cat');
        const busca = params.get('search');

        const novas = bancoDeReceitasCompleto.filter(r => {
            const secao = String(r.secao || '').toLowerCase().trim();
            return secao === 'novas' || secao === '';
        });
        let populares = [...bancoDeReceitasCompleto].sort((a, b) => {

            const totalVotosA = a.total_votos > 0 ? a.total_votos : 0;
            const totalVotosB = b.total_votos > 0 ? b.total_votos : 0;

            const mediaA = totalVotosA > 0 ? a.total_estrelas / totalVotosA : 0;
            const mediaB = totalVotosB > 0 ? b.total_estrelas / totalVotosB : 0;

            if (mediaB !== mediaA) return mediaB - mediaA;
            return totalVotosB - totalVotosA;
        }).slice(0, 12);


        if (acao === 'todas') {
            restaurarSecaoNovas();
            exibirBlocosAuxiliares(false);
            document.getElementById('titulo-novas').innerText = "TODAS AS RECEITAS";
            document.getElementById('sub-novas').innerText = `(Mostrando o acervo de todas as receitas do site)`;
            const ordenadasPorAvaliacao = [...bancoDeReceitasCompleto].sort((a, b) => {
                const mediaA = a.total_votos > 0 ? a.total_estrelas / a.total_votos : 0;
                const mediaB = b.total_votos > 0 ? b.total_estrelas / b.total_votos : 0;
                return mediaB - mediaA;
            });
            montarGrid(ordenadasPorAvaliacao, 'receitas-novas');
        } else if (acao === 'categorias') {
            exibirRepositorioDeCategorias();
        } else if (categoria) {
            restaurarSecaoNovas();
            executarFiltroCategoriaSemHistorico(categoria);
        } else if (busca) {
            restaurarSecaoNovas();
            executarFiltroBuscaSemHistorico(busca);
        } else {
            inputBusca.value = "";
            exibirBlocosAuxiliares(true);
            document.getElementById('titulo-novas').innerText = "RECEITAS NOVAS";
            document.getElementById('sub-novas').innerText = "(Lista das receitas mais recentes adicionadas)";
            
            const novasOrdenadasPorId = [...bancoDeReceitasCompleto]
                .filter(r => String(r.secao || '').toLowerCase().trim() === 'novas' || !r.secao)
                .sort((a, b) => (b.id || 0) - (a.id || 0));

            const ultimasQuatroNovas = novasOrdenadasPorId.slice(0, 4);

            montarGrid(ultimasQuatroNovas, 'receitas-novas');
            montarGrid(populares, 'receitas-populares');


            const todasReceitasOrdenadas = [...bancoDeReceitasCompleto].sort((a, b) => {

                const totalVotosA = a.total_votos > 0 ? a.total_votos : 0;
                const totalVotosB = b.total_votos > 0 ? b.total_votos : 0;

                const mediaA = totalVotosA > 0 ? a.total_estrelas / totalVotosA : 0;
                const mediaB = totalVotosB > 0 ? b.total_estrelas / totalVotosB : 0;

                if (mediaB !== mediaA) return mediaB - mediaA;

                return totalVotosB - totalVotosA;
            });
            const melhorReceitasDestaque = todasReceitasOrdenadas.slice(0, 4);
            montarGrid(melhorReceitasDestaque, 'receitas-destaque');
        }
    }

    function irParaPagina(urlFicticia) {
        history.pushState(null, '', urlFicticia);
        navegarPelaUrlAtual();
    }

    window.addEventListener('popstate', () => {
        navegarPelaUrlAtual();
    });

    function montarGrid(lista, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = "";
        
        if (lista.length === 0) {
            container.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 20px; color:#888;'>Nenhuma receita encontrada para este filtro.</p>";
            return;
        }

        lista.forEach(item => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.style.cursor = "pointer";
            card.onclick = () => { window.location.href = `receita.html?id=${item.id}`; };

            const mediaEstrelas = item.total_votos > 0 ? (item.total_estrelas / item.total_votos).toFixed(1) : 0;
            const totalVotos = item.total_votos || 0;
            
            const estrelasHTML = mediaEstrelas > 0 ? `
                <div style="margin-top: 8px; font-size: 12px; color: #f39c12;">
                    ${'★'.repeat(Math.round(mediaEstrelas))}${'☆'.repeat(5-Math.round(mediaEstrelas))} ${mediaEstrelas} (${totalVotos})
                </div>
            ` : '';

            card.innerHTML = `
                <div class="recipe-card-img">
                    <img src="${item.imagem}" alt="${item.titulo}">
                </div>
                <div class="recipe-card-content">
                    <h3>${item.titulo}</h3>
                    <p>${item.desc}</p>
                    ${estrelasHTML}
                    <span style="color: #d35400; font-weight: bold; margin-top: auto; transition: color 0.3s;">Ver receita &rarr;</span>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function exibirBlocosAuxiliares(mostrar) {
        const estado = mostrar ? 'block' : 'none';
        document.getElementById('bloco-destaque').style.display = estado;
        document.getElementById('bloco-categorias').style.display = estado;
        document.getElementById('sec-populares').style.display = estado;
    }

    function restaurarSecaoNovas() {
        const secNovas = document.getElementById('sec-novas');
        secNovas.innerHTML = `
            <div class="section-title">
                <h2 id="titulo-novas">RECEITAS NOVAS</h2>
                <p id="sub-novas">(Lista das receitas mais recentes adicionadas)</p>
            </div>
            <div class="grid-container" id="receitas-novas"></div>
        `;
    }

    function mediaExibicaoEstrelas(mediaEstrelas, totalVotos) {
        return mediaEstrelas > 0 ? `
            <div style="margin-top: 8px; font-size: 12px; color: #f39c12;">
                ${'★'.repeat(Math.round(mediaEstrelas))}${'☆'.repeat(5-Math.round(mediaEstrelas))} ${mediaEstrelas} (${totalVotos})
            </div>
        ` : '';
    }

    function exibirRepositorioDeCategorias() {
            exibirBlocosAuxiliares(false);

            const categorias = ['PRATOS PRINCIPAIS', 'SOBREMESAS', 'BEBIDAS', 'LANCHES', 'SAUDÁVEIS'];
            const secNovas = document.getElementById('sec-novas');
            
            secNovas.innerHTML = `
                <div class="section-title">
                    <h2>REPOSITÓRIO DE CATEGORIAS</h2>
                    <p>(Filtro avançado baseado em avaliações de usuários)</p>
                </div>
                <div id="categorias-repository"></div>
            `;
            
            const repositorio = document.getElementById('categorias-repository');
        
        categorias.forEach(categoria => {
            const receitasCategoria = bancoDeReceitasCompleto
                .filter(r => r.categoria.toUpperCase() === categoria.toUpperCase())
                .sort((a, b) => {
                    const mediaA = a.total_votos > 0 ? a.total_estrelas / a.total_votos : 0;
                    const mediaB = b.total_votos > 0 ? b.total_estrelas / b.total_votos : 0;
                    return mediaB - mediaA;
                });
            
            const secaoCategoria = document.createElement('div');
            secaoCategoria.className = 'categoria-repository-section';
            secaoCategoria.style.marginBottom = '45px';
            
            const titulo = document.createElement('h3');
            titulo.innerText = `| ${categoria}`;
            titulo.style.fontSize = '18px';
            titulo.style.fontWeight = 'bold';
            titulo.style.marginBottom = '15px';
            titulo.style.paddingBottom = '10px';
            titulo.style.borderBottom = '3px solid #d35400';
            titulo.style.color = '#333';
            
            secaoCategoria.appendChild(titulo);
            
            const gridReceitas = document.createElement('div');
            gridReceitas.className = 'grid-container categoria-grid';
            
            const topSete = receitasCategoria.slice(0, 7);
            topSete.forEach(receita => {
                const card = document.createElement('div');
                card.className = 'recipe-card';
                card.style.cursor = 'pointer';
                card.onclick = () => { window.location.href = `receita.html?id=${receita.id}`; };
                
                const mediaEstrelas = receita.total_votos > 0 ? (receita.total_estrelas / receita.total_votos).toFixed(1) : 0;
                const totalVotos = receita.total_votos || 0;
                
                const estrelasHTML = mediaExibicaoEstrelas(mediaEstrelas, totalVotos);
                
                card.innerHTML = `
                    <div class="recipe-card-img">
                        <img src="${receita.imagem}" alt="${receita.titulo}">
                    </div>
                    <div class="recipe-card-content">
                        <h3>${receita.titulo}</h3>
                        <p>${receita.desc}</p>
                        ${estrelasHTML}
                        <span style="color: #d35400; font-weight: bold; margin-top: auto; transition: color 0.3s;">Ver receita &rarr;</span>
                    </div>
                `;
                gridReceitas.appendChild(card);
            });
            
            const verMaisCard = document.createElement('div');
            verMaisCard.className = 'recipe-card vermais-card';
            
            verMaisCard.innerHTML = `
                <div class="recipe-card-content vermais-card-content">
                    <a href="?cat=${encodeURIComponent(categoria)}" class="vermais-link">
                        <span class="vermais-label">VER MAIS +</span>
                        <small>Expandir ${categoria.toLowerCase()}</small>
                    </a>
                </div>
            `;
            
            const verMaisLink = verMaisCard.querySelector('.vermais-link');
            if (verMaisLink) {
                verMaisLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    irParaPagina(`?cat=${encodeURIComponent(categoria)}`);
                });
            }
            
            verMaisCard.addEventListener('click', () => {
                irParaPagina(`?cat=${encodeURIComponent(categoria)}`);
            });
            
            gridReceitas.appendChild(verMaisCard);
            
            secaoCategoria.appendChild(gridReceitas);
            repositorio.appendChild(secaoCategoria);
        });
    }

    function removerAcentos(texto) {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }


    function executarFiltroBuscaSemHistorico(termo) {
        inputBusca.value = termo;
        const termoLimpo = removerAcentos(termo.toLowerCase());

        const filtradas = bancoDeReceitasCompleto.filter(r => {
            const tituloLimpo = removerAcentos(r.titulo.toLowerCase());
            const descLimpa = removerAcentos(r.desc.toLowerCase());
            const catLimpa = removerAcentos(r.categoria.toLowerCase());

            return tituloLimpo.includes(termoLimpo);
        });

        exibirBlocosAuxiliares(false);
        document.getElementById('titulo-novas').innerText = `RESULTADO DA BUSCA: "${termo}"`;
        document.getElementById('sub-novas').innerText = `(${filtradas.length} receitas encontradas)`;
        montarGrid(filtradas, 'receitas-novas');
    }

    function executarFiltroCategoriaSemHistorico(cat) {
        const filtradas = bancoDeReceitasCompleto.filter(r => r.categoria.toUpperCase() === cat.toUpperCase());
        exibirBlocosAuxiliares(false);
        document.getElementById('titulo-novas').innerText = `${cat.toUpperCase()}`;
        document.getElementById('sub-novas').innerText = `(Navegando pelas melhores receitas dessa categoria)`;
        montarGrid(filtradas, 'receitas-novas');
    }

    function dispararBusca() {
        const termo = inputBusca.value.trim();
        if (termo === "") {
            alert("Digite algo para buscar!");
            return;
        }
        irParaPagina(`?search=${encodeURIComponent(termo)}`);
    }

    btnBuscar.addEventListener('click', dispararBusca);
    inputBusca.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') dispararBusca(); 
    });

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const catSelecionada = card.getAttribute('data-categoria');
            irParaPagina(`?cat=${encodeURIComponent(catSelecionada)}`);
        });
    });

    document.querySelectorAll('.nav-cat-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-cat');
            if (cat === "TODAS") {
                irParaPagina('?view=todas');
            } else if (cat === "CATEGORIAS") {
                irParaPagina('?view=categorias');
            } else {
                irParaPagina(`?cat=${encodeURIComponent(cat)}`);
            }
        });
    });

    const resetarHomeEvent = (e) => {
        e.preventDefault();

        window.location.href = 'index.html';
    };

    document.getElementById('nav-home').addEventListener('click', resetarHomeEvent);
    document.getElementById('btn-home-logo').addEventListener('click', resetarHomeEvent);
});