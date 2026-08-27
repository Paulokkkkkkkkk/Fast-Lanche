// Teste do módulo da Página Home (Fase 32)
// Regras de negócio do produto em destaque.
import * as home from '../js/home.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        console.log('  ✓ ' + message);
    } else {
        failed++;
        console.error('  ✗ ' + message);
    }
}

console.log('=== TESTE DA PÁGINA HOME (FASE 32) ===');

// ---- Fixtures ----
const produtoPreferido = { id: 14, name: 'Combo Fast', active: true };
const outroAtivo = { id: 5, name: 'X-Tudo', active: true };
const inativo = { id: 33, name: 'Combo Indisponível', active: false };
const semEstoque = { id: 2, name: 'X-Salada', active: true };
const lista = [inativo, semEstoque, outroAtivo, produtoPreferido];

const sempreDisponivel = () => true;
const nuncaDisponivel = () => false;
const apenasId5Disponivel = (id) => Number(id) === 5;

// --- isFeaturedItem ---
console.log('\n--- isFeaturedItem ---');
assert(home.isFeaturedItem(produtoPreferido) === true, 'Item ativo é destaque válido');
assert(home.isFeaturedItem(inativo) === false, 'Item inativo não é destaque');
assert(home.isFeaturedItem(null) === false, 'Item nulo não é destaque');
assert(home.isFeaturedItem(produtoPreferido, sempreDisponivel) === true, 'Ativo e com estoque é destaque');
assert(home.isFeaturedItem(produtoPreferido, nuncaDisponivel) === false, 'Sem estoque não é destaque');

// --- selectFeaturedFeature ---
console.log('\n--- selectFeaturedFeature ---');

const preferido = home.selectFeaturedFeature(lista, sempreDisponivel, 14);
assert(preferido && preferido.id === 14, 'Seleciona o produto preferido quando ativo/disponível');

const preInativo = home.selectFeaturedFeature([inativo, outroAtivo, semEstoque], sempreDisponivel, 33);
assert(preInativo && preInativo.id === 5, 'Cai para o próximo ativo quando o preferido é inativo');

const preSemEstoque =
    home.selectFeaturedFeature([semEstoque, outroAtivo], apenasId5Disponivel, 2);
assert(preSemEstoque && preSemEstoque.id === 5, 'Cai para o próximo disponível quando o preferido está sem estoque');

const todosInativos = home.selectFeaturedFeature([inativo], sempreDisponivel);
assert(todosInativos === null, 'Retorna null quando não há produto ativo');

const semEstoqueTotal = home.selectFeaturedFeature([semEstoque], nuncaDisponivel);
assert(semEstoqueTotal === null, 'Retorna null quando nenhum tem estoque');

assert(home.selectFeaturedFeature([]) === null, 'Retorna null para lista vazia');
assert(home.selectFeaturedFeature(undefined) === null, 'Retorna null para ausência de lista');
assert(home.selectFeaturedFeature('não é array') === null, 'Retorna null para entrada não-array');

// Sem callback de disponibilidade, considera estoque disponível (default)
const semCallback = home.selectFeaturedFeature([produtoPreferido]);
assert(semCallback && semCallback.id === 14, 'Sem callback, considera estoque disponível');

// Constante exportada
console.log('\n--- Constantes ---');
assert(home.FEATURED_PRODUCT_ID === 14, 'Produto destaque padrão é o Combo Fast (id 14)');

console.log('\n=== RESULTADO: ' + passed + ' passaram, ' + failed + ' falharam ===');
process.exit(failed > 0 ? 1 : 0);