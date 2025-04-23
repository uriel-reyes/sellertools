import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'Promotions.title',
    defaultMessage: 'Manage Promotions',
  },
  backButton: {
    id: 'Promotions.backButton',
    defaultMessage: 'Back to Dashboard',
  },
  loadingPromotions: {
    id: 'Promotions.loadingPromotions',
    defaultMessage: 'Loading promotions...',
  },
  errorFetchingPromotions: {
    id: 'Promotions.errorFetchingPromotions',
    defaultMessage: 'Error loading promotions: {error}',
  },
  noPromotionsFound: {
    id: 'Promotions.noPromotionsFound',
    defaultMessage: 'No promotions found for your store.',
  },
  columnName: {
    id: 'Promotions.columnName',
    defaultMessage: 'Promotion Name',
  },
  columnStatus: {
    id: 'Promotions.columnStatus',
    defaultMessage: 'Status',
  },
  columnCartPredicate: {
    id: 'Promotions.columnCartPredicate',
    defaultMessage: 'Cart Predicate',
  },
  columnTargetType: {
    id: 'Promotions.columnTargetType',
    defaultMessage: 'Target Type',
  },
  columnTargetDetails: {
    id: 'Promotions.columnTargetDetails',
    defaultMessage: 'Target Details',
  },
  columnValueType: {
    id: 'Promotions.columnValueType',
    defaultMessage: 'Discount Type',
  },
  columnValueAmount: {
    id: 'Promotions.columnValueAmount',
    defaultMessage: 'Discount Value',
  },
  statusActive: {
    id: 'Promotions.statusActive',
    defaultMessage: 'Active',
  },
  statusInactive: {
    id: 'Promotions.statusInactive',
    defaultMessage: 'Inactive',
  },
  columnDescription: {
    id: 'Promotions.columnDescription',
    defaultMessage: 'Description',
  },
  addPromotion: {
    id: 'Promotions.addPromotion',
    defaultMessage: 'Add Promotion',
  },
  selectPromotionType: {
    id: 'Promotions.selectPromotionType',
    defaultMessage: 'Select Promotion Type',
  },
  selectPromotionTypeDescription: {
    id: 'Promotions.selectPromotionTypeDescription',
    defaultMessage: 'Choose the type of promotion you would like to create.',
  },
  tierBasedPromotion: {
    id: 'Promotions.tierBasedPromotion',
    defaultMessage: 'Quantity Tier Discount',
  },
  tierBasedPromotionDescription: {
    id: 'Promotions.tierBasedPromotionDescription',
    defaultMessage: 'Create discounts based on the quantity of items purchased.',
  },
  customerGroupPromotion: {
    id: 'Promotions.customerGroupPromotion',
    defaultMessage: 'Customer Group Discount',
  },
  customerGroupPromotionDescription: {
    id: 'Promotions.customerGroupPromotionDescription',
    defaultMessage: 'Create discounts for specific customer groups.',
  },
  // Tier Discount Form Messages
  createTierDiscount: {
    id: 'Promotions.createTierDiscount',
    defaultMessage: 'Create Quantity Tier Discount',
  },
  basicInformation: {
    id: 'Promotions.basicInformation',
    defaultMessage: 'Basic Information',
  },
  promotionName: {
    id: 'Promotions.promotionName',
    defaultMessage: 'Promotion Name',
  },
  promotionDescription: {
    id: 'Promotions.promotionDescription',
    defaultMessage: 'Description',
  },
  conditions: {
    id: 'Promotions.conditions',
    defaultMessage: 'Conditions',
  },
  variantSku: {
    id: 'Promotions.variantSku',
    defaultMessage: 'Variant SKU',
  },
  quantity: {
    id: 'Promotions.quantity',
    defaultMessage: 'Quantity',
  },
  operatorIs: {
    id: 'Promotions.operatorIs',
    defaultMessage: 'is',
  },
  operatorIsNot: {
    id: 'Promotions.operatorIsNot',
    defaultMessage: 'is not',
  },
  operatorLessThanOrEqual: {
    id: 'Promotions.operatorLessThanOrEqual',
    defaultMessage: 'is equal to or less than',
  },
  operatorGreaterThan: {
    id: 'Promotions.operatorGreaterThan',
    defaultMessage: 'is greater than',
  },
  operatorGreaterThanOrEqual: {
    id: 'Promotions.operatorGreaterThanOrEqual',
    defaultMessage: 'is equal to or greater than',
  },
  enterSku: {
    id: 'Promotions.enterSku',
    defaultMessage: 'Enter SKU',
  },
  discountValue: {
    id: 'Promotions.discountValue',
    defaultMessage: 'Discount Value',
  },
  discountType: {
    id: 'Promotions.discountType',
    defaultMessage: 'Discount Type',
  },
  discountTypePercentage: {
    id: 'Promotions.discountTypePercentage',
    defaultMessage: 'Percentage',
  },
  discountTypeAbsolute: {
    id: 'Promotions.discountTypeAbsolute',
    defaultMessage: 'Fixed Amount',
  },
  percentageDiscountDescription: {
    id: 'Promotions.percentageDiscountDescription',
    defaultMessage: 'The discount will be applied as a percentage off the product price.',
  },
  absoluteDiscountDescription: {
    id: 'Promotions.absoluteDiscountDescription',
    defaultMessage: 'The discount will be applied as a fixed amount off the product price.',
  },
  absoluteDiscountHint: {
    id: 'Promotions.absoluteDiscountHint',
    defaultMessage: 'Enter the amount in dollars/euros (e.g., 10.99)',
  },
  percentageDiscountHint: {
    id: 'Promotions.percentageDiscountHint',
    defaultMessage: 'Enter a value between 0-100',
  },
  cancel: {
    id: 'Promotions.cancel',
    defaultMessage: 'Cancel',
  },
  createPromotion: {
    id: 'Promotions.createPromotion',
    defaultMessage: 'Create Promotion',
  },
  promotionCreateSuccess: {
    id: 'Promotions.promotionCreateSuccess',
    defaultMessage: 'Promotion "{name}" created successfully.',
  },
  promotionCreateError: {
    id: 'Promotions.promotionCreateError',
    defaultMessage: 'Error creating promotion. Please try again.',
  },
  sortOrder: {
    id: 'Promotions.sortOrder',
    defaultMessage: 'Sort Order',
  },
  sortOrderHint: {
    id: 'Promotions.sortOrderHint',
    defaultMessage: 'Enter a decimal value less than 1 (e.g., 0.5). Lower values will be shown first.',
  },
  sortOrderError: {
    id: 'Promotions.sortOrderError',
    defaultMessage: 'Sort order must be a decimal number less than 1.',
  },
  refreshButton: {
    id: 'Promotions.refreshButton',
    defaultMessage: 'Refresh',
  },
}); 