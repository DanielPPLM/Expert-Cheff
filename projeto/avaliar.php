<?php
header('Content-Type: application/json');

$arquivo = 'receitas.json';

if (!isset($_POST['id']) || !isset($_POST['nota'])) {
    echo json_encode(["status" => "erro"]);
    exit;
}

$id = intval($_POST['id']);
$nota = intval($_POST['nota']);

$receitas = json_decode(file_get_contents($arquivo), true);

foreach ($receitas as &$receita) {
    if ($receita['id'] == $id) {
        if (!isset($receita['total_estrelas'])) {
            $receita['total_estrelas'] = 0;
        }
        if (!isset($receita['total_votos'])) {
            $receita['total_votos'] = 0;
        }

        $receita['total_estrelas'] += $nota;
        $receita['total_votos']++;
        break;
    }
}

file_put_contents($arquivo, json_encode($receitas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(["status" => "sucesso"]);