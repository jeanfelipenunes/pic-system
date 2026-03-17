-- CreateEnum
CREATE TYPE "Role" AS ENUM ('usuario', 'gestor', 'executor', 'admin');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "departamento_id" TEXT,
    "role" "Role" NOT NULL DEFAULT 'usuario',
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "votos_disponiveis" INTEGER NOT NULL DEFAULT 10,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "responsavel_id" TEXT,
    "descricao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaStatus" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#6B7280',

    CONSTRAINT "IdeaStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "problema" TEXT,
    "solucao" TEXT,
    "beneficio" TEXT,
    "autor_id" TEXT NOT NULL,
    "departamento_id" TEXT,
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaTag" (
    "idea_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "IdeaTag_pkey" PRIMARY KEY ("idea_id","tag_id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaFollower" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "IdeaFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "executor_id" TEXT NOT NULL,
    "plano_execucao" TEXT,
    "resultado" TEXT,
    "ganho_estimado" DOUBLE PRECISION,
    "ganho_real" DOUBLE PRECISION,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Tag_nome_key" ON "Tag"("nome");
CREATE UNIQUE INDEX "Vote_idea_id_user_id_key" ON "Vote"("idea_id", "user_id");
CREATE UNIQUE INDEX "IdeaFollower_idea_id_user_id_key" ON "IdeaFollower"("idea_id", "user_id");
CREATE UNIQUE INDEX "Execution_idea_id_key" ON "Execution"("idea_id");
CREATE UNIQUE INDEX "SystemConfig_chave_key" ON "SystemConfig"("chave");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Department" ADD CONSTRAINT "Department_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "IdeaStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IdeaTag" ADD CONSTRAINT "IdeaTag_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaTag" ADD CONSTRAINT "IdeaTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IdeaFollower" ADD CONSTRAINT "IdeaFollower_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdeaFollower" ADD CONSTRAINT "IdeaFollower_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Execution" ADD CONSTRAINT "Execution_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
