import {
  completeOnboarding,
  deleteAccount,
  getSessionByToken,
  logout,
  startLogin,
} from "../services/auth.service.js";

function readToken(request) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
}

export async function login(request, response) {
  try {
    const { email = "contato@agendapro.app", password = "", provider = "email" } = request.body ?? {};
    response.json(await startLogin({ email, password, provider }));
  } catch (error) {
    response.status(error.statusCode ?? 500).json({ message: error.message });
  }
}

export async function getSession(request, response) {
  try {
    response.json(await getSessionByToken(readToken(request)));
  } catch (error) {
    response.status(error.statusCode ?? 500).json({ message: error.message });
  }
}

export async function finishOnboarding(request, response) {
  try {
    const token = readToken(request);
    const { nome, nomeEmpresa, telefone, senha } = request.body ?? {};

    response.json(
      await completeOnboarding({
        token,
        nome,
        nomeEmpresa,
        telefone,
        senha,
      }),
    );
  } catch (error) {
    response.status(error.statusCode ?? 500).json({ message: error.message });
  }
}

export function signOut(_request, response) {
  response.json(logout());
}

export async function deleteCurrentAccount(request, response) {
  try {
    response.json(await deleteAccount(readToken(request)));
  } catch (error) {
    response.status(error.statusCode ?? 500).json({ message: error.message });
  }
}
