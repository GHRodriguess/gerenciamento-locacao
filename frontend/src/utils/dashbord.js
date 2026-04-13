export const getTopClients = (data) => {
    const counts = {};
    
    data.filter(loc => !loc.cancelada).forEach((loc) => {
        const nome = loc.cliente.nome;
        counts[nome] = (counts[nome] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total);
};

export const getMonthlyStats = (data) => {
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const stats = {};
        data.filter(l => !l.cancelada).forEach(loc => {
            const date = new Date(loc.data_montagem);
            const mName = months[date.getMonth()];
            if (!stats[mName]) stats[mName] = { name: mName, rendimento: 0, total: 0 };
            stats[mName].rendimento += parseFloat(loc.valor_total);
            stats[mName].total += 1;
        });
        return Object.values(stats);
    };

export const getToyStats = (data) => {
    const toyCounts = {};
    data.filter((l) => !l.cancelada).forEach((loc) => {
        loc.brinquedos.forEach((b) => {
            const nomeLimpo = b.tipo.replaceAll("-", " ");
            toyCounts[nomeLimpo] = (toyCounts[nomeLimpo] || 0) + 1;
        });
    });
    return Object.entries(toyCounts)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total);
};


export const getToyRanking = (data) => {
    const toyCount = {};
    data.filter(l => !l.cancelada).forEach(l => {
        l.brinquedos.forEach(b => {
            const name = b.tipo.replaceAll("-", " ");
            toyCount[name] = (toyCount[name] || 0) + 1;
        });
    });
    return Object.entries(toyCount)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total);
};
