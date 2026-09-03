import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const clienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  numero_celular: z.string().min(10, "Informe um número de telefone válido"),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

export const brinquedoSchema = z.object({
  tipo: z.string().min(1, "Selecione o tipo de brinquedo"),
  ativo: z.boolean().default(true),
});

export type BrinquedoFormData = z.infer<typeof brinquedoSchema>;

export const colaboradorSchema = z.object({
  username: z.string().min(3, "Username deve ter no mínimo 3 caracteres"),
  first_name: z.string().min(1, "Primeiro nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Informe um e-mail válido"),
});

export type ColaboradorFormData = z.infer<typeof colaboradorSchema>;

export const locacaoSchema = z.object({
  cliente_id: z.coerce.number({ required_error: "Selecione um cliente" }).min(1, "Selecione um cliente"),
  data_montagem: z.string().min(1, "Data de montagem é obrigatória"),
  data_devolucao: z.string().min(1, "Data de devolução é obrigatória"),
  valor_total: z.string().min(1, "Informe o valor total da locação"),
  brinquedos_ids: z.array(z.number()).min(1, "Selecione pelo menos um brinquedo"),
  endereco: z.object({
    rua: z.string().min(1, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    cidade: z.string().min(1, "Cidade é obrigatória"),
    bairro: z.string().optional(),
    estado: z.string().optional(),
    complemento: z.string().optional(),
  }),
});

export type LocacaoSchemaType = z.infer<typeof locacaoSchema>;
