<script setup>


</script>

<template>
    <div>
        <div class="not-found-container">
            <div class="not-found-content">
                <h1 class="not-found-title">404 Not Found</h1>
                <p class="not-found-desc">Description: HTTP 404. The resource you are looking for (or one of its
                    dependencies) could have been removed, had its name changed, or is temporarily unavailable. Please
                    review the following URL and make sure that it is spelled correctly.</p>
                <p class="not-found-desc">描述：HTTP 404。您要查找的资源（或其依赖项）可能已被删除、名称已更改，或暂时不可用。请检查以下 URL 并确保其拼写正确。</p>
                <p class="not-found-desc">Descripción: HTTP 404. El recurso que está buscando (o una de sus
                    dependencias) podría haber sido eliminado, haber cambiado de nombre o no estar disponible
                    temporalmente. Revise la siguiente URL y asegúrese de que esté escrita correctamente.</p>
                <p class="not-found-desc">Description : HTTP 404. La ressource que vous recherchez (ou l'une de ses
                    dépendances) a peut-être été supprimée, renommée ou est temporairement indisponible. Veuillez
                    vérifier l'URL ci-dessous et vous assurer qu'elle est correctement orthographiée.</p>
                <p class="not-found-desc" dir="rtl">الوصف: HTTP 404. قد يكون المورد الذي تبحث عنه (أو أحد تبعياته) قد تم
                    حذفه، أو تغيير اسمه، أو أنه غير متوفر مؤقتًا. يرجى مراجعة عنوان URL التالي والتأكد من كتابته بشكل
                    صحيح.</p>

            </div>
        </div>
    </div>
</template>

<style scoped>
.not-found-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2rem;
    box-sizing: border-box;
}

.not-found-content {
    text-align: center;
}

.not-found-status {
    font-size: 8rem;
    font-weight: 900;
    line-height: 1;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
}

.not-found-title {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.not-found-desc {
    text-align: center;
    display: inline-block;
    justify-content: center;
    max-width: 80%;
    font-size: 1.1rem;
    color: var(--color-text-disabled);
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .not-found-desc {
        max-width: 95%;
    }
}
</style>
