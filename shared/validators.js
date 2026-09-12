// Validações de formulário compartilhadas entre o cadastro do aluno e do
// professor, pra regra de senha nunca divergir entre os dois lados.

// Retorna a lista de requisitos que a senha ainda não cumpre (vazia = ok).
export function requisitosSenhaFaltando(senha) {
  const faltando = [];
  if (senha.length < 8) faltando.push("mínimo 8 caracteres");
  if (!/[A-Z]/.test(senha)) faltando.push("uma letra maiúscula");
  if (!/[a-z]/.test(senha)) faltando.push("uma letra minúscula");
  if (!/[1-9]/.test(senha)) faltando.push("um número");
  if (!/[^A-Za-z0-9]/.test(senha)) faltando.push("um caractere especial");
  return faltando;
}

// Validação de CPF por dígito verificador (mod 11), sem depender de lib
// externa. Aceita com ou sem pontuação — normaliza antes de checar.
export function cpfValido(cpfInput) {
  const cpf = cpfInput.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digitoVerificador = (base) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digitoVerificador(cpf.slice(0, 9));
  const d2 = digitoVerificador(cpf.slice(0, 9) + d1);
  return cpf === cpf.slice(0, 9) + String(d1) + String(d2);
}
