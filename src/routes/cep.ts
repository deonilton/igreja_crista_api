import { Router } from 'express';
import { CepService } from '../shared/services/cep.service';

const router = Router();

/**
 * @route GET /api/cep/:cep
 * @desc Busca endereço pelo CEP
 * @access Public
 * @example GET /api/cep/01310200
 */
router.get('/:cep', async (req, res) => {
  try {
    const { cep } = req.params;

    if (!cep) {
      return res.status(400).json({
        success: false,
        message: 'CEP é obrigatório'
      });
    }

    const cepData = await CepService.buscarPorCep(cep);

    res.json({
      success: true,
      data: {
        ...cepData,
        cepFormatado: CepService.formatarCep(cepData.cep)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    
    const message = error instanceof Error ? error.message : 'Erro ao consultar CEP';
    const statusCode = message.includes('não encontrado') ? 404 : 400;

    res.status(statusCode).json({
      success: false,
      message
    });
  }
});

/**
 * @route POST /api/cep/validar
 * @desc Valida formato do CEP
 * @access Public
 * @example POST /api/cep/validar { cep: "01310-200" }
 */
router.post('/validar', (req, res) => {
  try {
    const { cep } = req.body;

    if (!cep) {
      return res.status(400).json({
        success: false,
        message: 'CEP é obrigatório'
      });
    }

    const isValid = CepService.validarCep(cep);
    const formatado = CepService.formatarCep(cep);

    res.json({
      success: true,
      data: {
        valido: isValid,
        formatado,
        original: cep
      }
    });
  } catch (error) {
    console.error('Erro ao validar CEP:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao validar CEP'
    });
  }
});

export default router;
