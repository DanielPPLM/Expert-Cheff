<?php
header('Content-Type: application/json');

$arquivo = 'receitas.json';

if (!file_exists($arquivo)) {
    file_put_contents($arquivo, json_encode([]));
}

$dados_atuais = json_decode(file_get_contents($arquivo), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (isset($_POST['action']) && $_POST['action'] === 'delete' && isset($_POST['id'])) {
        $idToDelete = intval($_POST['id']);
        $dados_atuais = array_values(array_filter($dados_atuais, function($item) use ($idToDelete) {
            return !(isset($item['id']) && intval($item['id']) === $idToDelete);
        }));
        file_put_contents($arquivo, json_encode($dados_atuais, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["status" => "sucesso"]);
        exit;
    }

    $idReceita = isset($_POST['id']) ? intval($_POST['id']) : null;
    $imagemAtual = isset($_POST['imagem_atual']) ? $_POST['imagem_atual'] : null;
    $indiceExistente = null;

    if ($idReceita !== null) {
        foreach ($dados_atuais as $index => $item) {
            if (isset($item['id']) && intval($item['id']) === $idReceita) {
                $indiceExistente = $index;
                break;
            }
        }
    }

    if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
        $nomeImagem = time() . "_" . basename($_FILES['imagem']['name']);
        $caminhoImagem = "imagens/" . $nomeImagem;
        move_uploaded_file($_FILES['imagem']['tmp_name'], $caminhoImagem);
    } elseif ($imagemAtual) {
        $caminhoImagem = $imagemAtual;
    } else {
        $caminhoImagem = "imagens/sem-foto.jpg";
    }

    $secao = isset($_POST['secao']) ? strtolower(trim($_POST['secao'])) : 'novas';
    if ($secao !== 'populares') {
        $secao = 'novas';
    }

    $receitaDados = [
        "titulo" => $_POST['titulo'],
        "secao" => $secao,
        "categoria" => $_POST['categoria'],
        "desc" => $_POST['desc'],
        "imagem" => $caminhoImagem,
        "tempo_preparo" => $_POST['tempo_preparo'],
        "rendimento" => $_POST['rendimento'],
        "dificuldade" => $_POST['dificuldade'],
        "ingredientes" => array_filter(array_map('trim', explode("\n", $_POST['ingredientes']))),
        "modo_preparo" => array_filter(array_map('trim', explode("\n", $_POST['modo_preparo']))),
        "dica_chef" => $_POST['dica_chef'],
        "calorias" => $_POST['calorias'],
        "proteinas" => $_POST['proteinas'],
        "carboidratos" => $_POST['carboidratos'],
        "gorduras" => $_POST['gorduras']
    ];

    if ($indiceExistente !== null) {
        $dados_atuais[$indiceExistente] = array_merge($dados_atuais[$indiceExistente], $receitaDados);
        $dados_atuais[$indiceExistente]['id'] = $idReceita;
    } else {
        $novaReceita = array_merge(["id" => count($dados_atuais) > 0 ? end($dados_atuais)['id'] + 1 : 1], $receitaDados);
        $dados_atuais[] = $novaReceita;
    }

    file_put_contents($arquivo, json_encode($dados_atuais, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode(["status" => "sucesso"]);
    exit;
}

echo json_encode($dados_atuais);