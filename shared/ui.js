// Interações de UI puras (sem estado de negócio), compartilhadas entre
// aluno/, painel/ e admin/.

// Liga o botão de mostrar/esconder senha aos campos marcados com
// .password-field (um <input type="password"> seguido de um
// button.toggle-senha, lado a lado no mesmo wrapper).
export function ativarToggleDeSenha(root = document) {
  root.querySelectorAll(".toggle-senha").forEach((botao) => {
    const input = botao.previousElementSibling;
    if (!input) return;

    botao.addEventListener("click", () => {
      const vaiMostrar = input.type === "password";
      input.type = vaiMostrar ? "text" : "password";
      botao.textContent = vaiMostrar ? "🙈" : "👁";
      botao.setAttribute("aria-label", vaiMostrar ? "Esconder senha" : "Mostrar senha");
    });
  });
}
