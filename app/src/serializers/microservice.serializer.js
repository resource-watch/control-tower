class MicroserviceSerializer {

    static serializeElement(el) {
        return {
            id: el._id,
            name: el.name,
            url: el.url,
            updatedAt: el.updatedAt,
            createdAt: el.createdAt,
            endpoints: el.endpoints,
            version: el.version
        };
    }

    static serialize(data, link = null) {
        const result = {};
        if (data && Array.isArray(data) && data.length === 0) {
            result.data = [];
            return result;
        }
        if (data) {
            if (data.docs) {
                while (data.docs.indexOf(undefined) >= 0) {
                    data.docs.splice(data.docs.indexOf(undefined), 1);
                }
                result.data = data.docs.map((el) => MicroserviceSerializer.serializeElement(el));
            } else if (Array.isArray(data)) {
                result.data = MicroserviceSerializer.serializeElement(data[0]);
            } else {
                result.data = MicroserviceSerializer.serializeElement(data);
            }
        }
        if (link) {
            result.links = {
                self: `${link}page[number]=${data.page}&page[size]=${data.limit}`,
                first: `${link}page[number]=1&page[size]=${data.limit}`,
                last: `${link}page[number]=${data.pages}&page[size]=${data.limit}`,
                prev: `${link}page[number]=${data.page - 1 > 0 ? data.page - 1 : data.page}&page[size]=${data.limit}`,
                next: `${link}page[number]=${data.page + 1 < data.pages ? data.page + 1 : data.pages}&page[size]=${data.limit}`,
            };
            result.meta = {
                'total-pages': data.pages,
                'total-items': data.total,
                size: data.limit
            };
        }
        return result;
    }

}

module.exports = MicroserviceSerializer;
