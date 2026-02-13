import { Op } from 'sequelize';
import moment from 'moment';
import { TradeShow } from '../models/postgres/tradeShow.model';

/**
 * Activate trade shows where tradeShowDate matches current date
 * Sets status to 'active' for trade shows that start today
 */
export const activateTradeShows = async () => {
  try {
    const today = moment().startOf('day').format('YYYY-MM-DD');
    
    console.log(`[TradeShow Cron] Checking for trade shows to activate on ${today}`);

    // Find all trade shows where tradeShowDate matches today and status is not already 'active'
    const tradeShowsToActivate = await TradeShow.findAll({
      where: {
        tradeShowDate: today,
        status: {
          [Op.ne]: 'active'
        }
      }
    });

    console.log(`[TradeShow Cron] Found ${tradeShowsToActivate.length} trade show(s) to activate`);

    if (tradeShowsToActivate.length === 0) {
      return {
        activated: 0,
        message: 'No trade shows to activate'
      };
    }

    // Update status to 'active'
    const [affectedRows] = await TradeShow.update(
      { status: 'active' },
      {
        where: {
          tradeShowDate: today,
          status: {
            [Op.ne]: 'active'
          }
        }
      }
    );

    console.log(`[TradeShow Cron] ✅ Activated ${affectedRows} trade show(s)`);

    // Log details of activated trade shows
    tradeShowsToActivate.forEach((tradeShow) => {
      console.log(`[TradeShow Cron]   - Activated: ${tradeShow.name} (ID: ${tradeShow.id})`);
    });

    return {
      activated: affectedRows,
      tradeShows: tradeShowsToActivate.map(ts => ({
        id: ts.id,
        name: ts.name,
        tradeShowDate: ts.tradeShowDate
      }))
    };
  } catch (error: any) {
    console.error('[TradeShow Cron] ❌ Error activating trade shows:', error);
    throw error;
  }
};

/**
 * Expire trade shows where tradeShowDate is less than current date
 * Sets status to 'expire' for trade shows that have passed
 */
export const expireTradeShows = async () => {
  try {
    const todayString = moment().startOf('day').format('YYYY-MM-DD');
    
    console.log(`[TradeShow Cron] Checking for expired trade shows (before ${todayString})`);

    // Find all trade shows where tradeShowDate is less than today and status is not already 'expire'
    const tradeShowsToExpire = await TradeShow.findAll({
      where: {
        tradeShowDate: {
          [Op.lt]: todayString
        },
        status: {
          [Op.ne]: 'expire'
        }
      }
    });

    console.log(`[TradeShow Cron] Found ${tradeShowsToExpire.length} trade show(s) to expire`);

    if (tradeShowsToExpire.length === 0) {
      return {
        expired: 0,
        message: 'No trade shows to expire'
      };
    }

    // Update status to 'expire'
    const [affectedRows] = await TradeShow.update(
      { status: 'expire' },
      {
        where: {
          tradeShowDate: {
            [Op.lt]: todayString
          },
          status: {
            [Op.ne]: 'expire'
          }
        }
      }
    );

    console.log(`[TradeShow Cron] ✅ Expired ${affectedRows} trade show(s)`);

    // Log details of expired trade shows
    tradeShowsToExpire.forEach((tradeShow) => {
      console.log(`[TradeShow Cron]   - Expired: ${tradeShow.name} (ID: ${tradeShow.id}, Date: ${tradeShow.tradeShowDate})`);
    });

    return {
      expired: affectedRows,
      tradeShows: tradeShowsToExpire.map(ts => ({
        id: ts.id,
        name: ts.name,
        tradeShowDate: ts.tradeShowDate
      }))
    };
  } catch (error: any) {
    console.error('[TradeShow Cron] ❌ Error expiring trade shows:', error);
    throw error;
  }
};
