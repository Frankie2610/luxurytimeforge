export type Status='active'|'draft'|'archived';
export interface Variant{id:string;title:string;sku:string;price:number;compareAtPrice:number;inventory:number;optionValues?:Record<string,string>}
export interface ProductOption{id:string;name:string;values:string[]}
export interface Metafield{id:string;namespace:string;key:string;value:string;type:string}
export interface Product{id:string;handle:string;title:string;descriptionHtml:string;descriptionText:string;vendor:string;productType:string;category:string;tags:string[];status:Status;published:boolean;images:string[];price:number;compareAtPrice:number;cost:number;sku:string;barcode:string;inventory:number;trackInventory:boolean;weight:number;weightUnit:string;seoTitle:string;seoDescription:string;variants:Variant[];options?:ProductOption[];metafields?:Metafield[];createdAt:string;updatedAt:string;rawShopify?:Record<string,string>}
export type CollectionConditionField='vendor'|'productType'|'tag'|'status'|'price'|'compareAtPrice'|'inventory'|'gender'|'discountPercent';
export type CollectionConditionOperator='equals'|'not_equals'|'contains'|'not_contains'|'greater_than'|'less_than'|'greater_or_equal'|'less_or_equal'|'is_set'|'is_not_set';
export interface Condition{field:CollectionConditionField;operator:CollectionConditionOperator;value:string}
export interface Collection{id:string;handle:string;title:string;description:string;type:'manual'|'automatic';status:'active'|'draft';image:string;productIds:string[];conditions:Condition[];conditionMatch?:'all'|'any'}
export interface ProductGroupItem{id:string;productId:string;sku:string;name:string;color:string;size:string;image:string;sortOrder:number}
export interface ProductGroup{id:string;name:string;skuPrefix:string;description:string;status:'active'|'draft';items:ProductGroupItem[];createdAt:string;updatedAt:string;source?:'automatic'|'manual';autoKey?:string;vendor?:string;manualOverride?:boolean}
export interface CustomerAddress{id:string;firstName:string;lastName:string;phone:string;address1:string;address2:string;ward:string;district:string;city:string;country:string;postalCode:string;isDefault:boolean}
export interface CustomerNote{id:string;createdAt:string;text:string}
export interface Customer{id:string;name:string;email:string;phone:string;ordersCount:number;totalSpent:number;tags:string[];createdAt:string;addresses?:CustomerAddress[];notes?:CustomerNote[];acceptsMarketing?:boolean}
export type NewsletterSubscriberStatus='active'|'unsubscribed';
export interface NewsletterSubscriber{id:string;email:string;source:string;status:NewsletterSubscriberStatus;createdAt:string;updatedAt:string}
export interface CartLine{productId:string;variantId:string;quantity:number}

export type OrderStatus='open'|'confirmed'|'completed'|'cancelled';
export type PaymentStatus='pending'|'paid'|'refunded'|'failed';
export type FulfillmentStatus='unfulfilled'|'processing'|'fulfilled'|'returned';
export interface OrderLine{id:string;productId:string;variantId:string;title:string;variantTitle:string;sku:string;image:string;quantity:number;unitPrice:number;lineTotal:number}
export interface ShippingAddress{fullName:string;phone:string;email:string;address1:string;address2:string;ward:string;district:string;city:string;country:string;postalCode:string}
export type PaymentMethod='cod'|'bank_transfer'|'payos'|'online';
export type PaymentConfirmationSource='payos_webhook'|'admin_bank_transfer'|'admin_manual';
export type BankTransferDiscountType='percentage'|'fixed_amount';
export interface BankAccount{id:string;bankName:string;accountName:string;accountNumber:string;branch:string;note:string;enabled:boolean;priority:number}
export interface BankTransferDiscount{enabled:boolean;type:BankTransferDiscountType;value:number;minimumSubtotal:number}
export interface Order{id:string;number:string;createdAt:string;updatedAt:string;customerId:string;customerName:string;customerEmail:string;customerPhone:string;shippingAddress:ShippingAddress;lines:OrderLine[];subtotal:number;discountCode:string;discountAmount:number;promotionDiscountAmount?:number;paymentDiscountAmount?:number;paymentDiscountLabel?:string;shippingAmount:number;taxAmount:number;total:number;currency:'VND';status:OrderStatus;paymentStatus:PaymentStatus;fulfillmentStatus:FulfillmentStatus;paymentMethod:PaymentMethod;paymentProvider?:'payos'|'generic';paymentReference?:string;paymentOrderCode?:number;paymentConfirmationSource?:PaymentConfirmationSource;paidAt?:string;bankTransferConfirmedAt?:string;bankAccountId?:string;bankName?:string;bankAccountName?:string;bankAccountNumber?:string;bankTransferContent?:string;shippingCarrier?:string;trackingNumber?:string;trackingUrl?:string;shippedAt?:string;deliveredAt?:string;note:string;source:'storefront'|'admin'}
export interface CheckoutPayload{customer:{name:string;email:string;phone:string};shippingAddress:ShippingAddress;paymentMethod:PaymentMethod;note:string;discountCode:string}
export type DiscountType='percentage'|'fixed_amount'|'free_shipping';
export interface Discount{id:string;code:string;title:string;type:DiscountType;value:number;minimumSubtotal:number;usageLimit:number;usageCount:number;startsAt:string;endsAt:string;active:boolean;createdAt:string}
export interface DiscountEvaluation{valid:boolean;message:string;discount?:Discount;amount:number;shippingDiscount:number}
export interface InventoryAdjustment{id:string;productId:string;variantId:string;sku:string;productTitle:string;delta:number;before:number;after:number;reason:'manual'|'order'|'cancelled_order'|'import'|'correction';note:string;createdAt:string;referenceId:string}
export type ActivityEntity='product'|'collection'|'customer'|'order'|'discount'|'inventory'|'theme'|'system';
export interface Activity{id:string;entity:ActivityEntity;entityId:string;action:string;detail:string;createdAt:string;actor:string}

export type TemplateKey='home'|'product'|'collection'|'search'|'cart'|'page';
export type BlockType='heading'|'text'|'button'|'image'|'iconText'|'productInfo'|'price'|'variantPicker'|'quantity'|'buyButtons'|'accordion'|'spacer'|'group';
export interface ThemeBlock{id:string;type:BlockType;visible:boolean;settings:Record<string,string|number|boolean>;children?:ThemeBlock[]}
export type SectionType='hero'|'trust'|'collections'|'products'|'bestSellers'|'blogPosts'|'multicolumn'|'video'|'imageText'|'richText'|'newsletter'|'testimonials'|'faq'|'logoList'|'gallery'|'countdownBanner'|'productMain'|'productRecommendations'|'collectionBanner'|'collectionGrid'|'searchResults'|'cartMain'|'pageContent';
export interface Section{id:string;type:SectionType;visible:boolean;settings:Record<string,string|number|boolean>;blocks:ThemeBlock[]}
export interface ThemeTemplate{key:TemplateKey;name:string;sections:Section[]}
export interface ThemeSettings{storeName:string;storeDescription:string;storePhone:string;storeEmail:string;storeAddress:string;taxId:string;facebookUrl:string;instagramUrl:string;tiktokUrl:string;recruitmentUrl:string;announcement:string;accent:string;background:string;surface:string;text:string;muted:string;textOnDark:string;radius:number;cardRadius:number;buttonRadius:number;contentWidth:number;sectionSpacing:number;headingScale:number;headingWeight:number;bodyWeight:number;headingFont:string;bodyFont:string;motion:'none'|'subtle'|'expressive';logoText:string;logoImage:string;showAnnouncement:boolean;stickyHeader:boolean}
export interface StoreProfile{storeName:string;storeDescription:string;storePhone:string;storeEmail:string;storeAddress:string;taxId:string;facebookUrl:string;instagramUrl:string;tiktokUrl:string;recruitmentUrl:string;logoImage:string;updatedAt:string}
export interface Theme{version:number;name:string;settings:ThemeSettings;templates:Record<TemplateKey,ThemeTemplate>}
export interface ThemeVersion{id:string;createdAt:string;note:string;theme:Theme}
export interface ThemeState{draft:Theme;published:Theme;publishedAt:string;versions:ThemeVersion[]}
export interface Seed{products:Product[];collections:Collection[];customers:Customer[]}
export interface ImportResult{products:Product[];headers:string[];rowCount:number;draftCount:number;warnings:string[]}

export type ReturnStatus='requested'|'approved'|'received'|'refunded'|'rejected'|'closed';
export interface ReturnRequestLine{id:string;orderLineId:string;productId:string;variantId:string;title:string;image:string;quantity:number;reason:string}
export interface ReturnRequest{id:string;requestType?:'return'|'exchange';number:string;orderId:string;orderNumber:string;customerId:string;customerName:string;customerEmail:string;customerPhone:string;createdAt:string;updatedAt:string;status:ReturnStatus;lines:ReturnRequestLine[];note:string;adminNote:string;refundAmount:number;restock:boolean;restockedAt?:string;exchangeProductId?:string;exchangeVariantId?:string;exchangeQuantity?:number;exchangeOrderId?:string;exchangePriceDifference?:number}
export interface MetaMarketingSettings{
  enabled:boolean;
  pixelId:string;
  siteUrl:string;
  defaultSource:string;
  defaultMedium:string;
}
export interface IntegrationSettings{payment:{cod:boolean;bankTransfer:boolean;online:boolean;onlineProvider:'generic'|'payos';createEndpoint:string;bankName:string;bankAccountName:string;bankAccountNumber:string;bankAccounts:BankAccount[];preferredBankAccountId:string;bankTransferDiscount:BankTransferDiscount};shipping:{defaultCarrier:string;trackingUrlTemplate:string;insured:boolean;freeShippingThreshold:number};customerAccount:{sessionMinutes:number;requireOrderChallenge:boolean}}
