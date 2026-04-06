import axios from 'axios';

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export class CepService {
  private static readonly VIACEP_URL = 'https://viacep.com.br/ws';

  /**
   * Busca informações de endereço pelo CEP
   * @param cep CEP sem formatação (apenas números)
   * @returns Promise<CepResponse>
   */
  static async buscarPorCep(cep: string): Promise<CepResponse> {
    try {
      // Remove caracteres não numéricos
      const cepLimpo = cep.replace(/\D/g, '');
      
      // Validação básica do CEP
      if (cepLimpo.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos');
      }

      const response = await axios.get<CepResponse>(
        `${this.VIACEP_URL}/${cepLimpo}/json`
      );

      // Verifica se o CEP foi encontrado
      if (response.data.erro) {
        throw new Error('CEP não encontrado');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erro ao consultar CEP: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Formata CEP para exibição (XXXXX-XXX)
   * @param cep CEP sem formatação
   * @returns CEP formatado
   */
  static formatarCep(cep: string): string {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return cep;
    return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }

  /**
   * Valida se um CEP está no formato correto
   * @param cep CEP para validar
   * @returns boolean
   */
  static validarCep(cep: string): boolean {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8 && /^\d{8}$/.test(cepLimpo);
  }
}
