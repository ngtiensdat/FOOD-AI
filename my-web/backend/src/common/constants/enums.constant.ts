export enum DiningTableStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
}

export enum BugReportStatus {
  PENDING = 'PENDING',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
}

export enum StaffAction {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  REVOKED = 'REVOKED',
  REMOVED = 'REMOVED',
  LEFT = 'LEFT',
}

export enum PromoType {
  DISCOUNT = 'DISCOUNT',
  GIFT = 'GIFT',
  BOGO = 'BOGO',
}

export enum ReportTargetType {
  POST = 'POST',
  FOOD = 'FOOD',
  RESTAURANT = 'RESTAURANT',
  USER = 'USER',
  COMMENT = 'COMMENT',
}
