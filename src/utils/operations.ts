import { Model, ModelStatic, Op } from "sequelize";
import { AppError } from "./AppError";

export class Operations {
  static async create<T extends Model>(
    model: ModelStatic<T>,
    data: any
  ): Promise<T> {
    try {
      return await model.create(data);
    } catch (error: any) {
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new AppError(
          error.errors?.[0]?.ValidationErrorItem?.message ||
            "Unique constraint failed",
          400
        );
      }

      throw new AppError(error.message, 400);
    }
  }

  static async findById<T extends Model>(
    model: ModelStatic<T>,
    id: number,
    options: { include?: any[] } = {}
  ): Promise<T | null> {
    try {
      return await model.findByPk(id, {
        include: options.include,
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  static async findAll<T extends Model>(
    model: ModelStatic<T>,
    options: any
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    try {
      const { page = 1, limit = 10, order = [], include = [] } = options;
      const offset = (page - 1) * limit;

      const [data, total] = await Promise.all([
        model.findAll({
          limit,
          offset,
          order,
          include,
        }),
        model.count(),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  static async update<T extends Model>(
    model: ModelStatic<T>,
    id: number,
    data: any
  ): Promise<T | null> {
    try {
      const record = await model.findByPk(id);
      if (!record) {
        throw new AppError(`${model.name} not found`, 404);
      }
      await record.update(data);
      return record;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message, 400);
    }
  }
  

  static async delete<T extends Model>(
    model: ModelStatic<T>,
    id: number
  ): Promise<boolean> {
    try {
      const record = await model.findByPk(id);
      if (!record) {
        throw new AppError(`${model.name} not found`, 404);
      }
      await record.destroy();
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message, 400);
    }
  }


  

static async findAndCountAll<T extends Model>(
  model: ModelStatic<T>,
  options: {
    page?: number;
    perPage?: number;
    search?: string;
    searchFields?: string[];
    where?: any;
    include?: any[];
    order?: any[];
    attributes?: string[];
  }
): Promise<{ data: T[]; total: number; page: number; perPage: number }> {
  try {
    const {
      page = 1,
      perPage = 10,
      search,
      searchFields = [],
      where = {},
      include = [],
      order = [],
      attributes = undefined,
    } = options;

    const offset = (page - 1) * perPage;

    // Search condition
    let searchCondition = {};
    if (search && searchFields.length > 0) {
      searchCondition = {
        [Op.or]: searchFields.map(field => ({
          [field]: { [Op.like]: `%${search}%` },
        })),
      };
    }

    const finalWhere = {
      ...where,
      ...searchCondition,
    };

    const { rows: data, count: total } = await model.findAndCountAll({
      where: finalWhere,
      include,
      order,
      attributes,
      limit: perPage,
      offset,
    });

    return {
      data,
      total,
      page,
      perPage,
    };
  } catch (error: any) {
    throw new AppError(error.message, 400);
  }
}


  static async findOne<T extends Model>(
    model: ModelStatic<T>,
    where: any,
    options: { include?: any[] } = {}
  ): Promise<T | null> {
    try {
      return await model.findOne({
        where,
        include: options.include,
      });
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  static async findAllWithWhere<T extends Model>(
    model: ModelStatic<T>,
    where: any,
    options: any
  ): Promise<any> {
    try {
      const { page = 1, limit = 10, order = [], include = [] } = options;
      const offset = (page - 1) * limit;

      const [data, total] = await Promise.all([
        model.findAll({
          where,
          limit,
          offset,
          order,
          include,
        }),
        model.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }
}
