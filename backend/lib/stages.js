const { InputError, decimal, object, text } = require('./validation');

const STAGES = ['prospecting', 'qualification', 'discovery', 'proposal', 'negotiation', 'legal_review', 'closed_won', 'closed_lost'];
const nextStages = {
  prospecting: ['qualification', 'closed_lost'],
  qualification: ['discovery', 'closed_lost'],
  discovery: ['proposal', 'closed_lost'],
  proposal: ['negotiation', 'closed_lost'],
  negotiation: ['legal_review', 'closed_lost'],
  legal_review: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
};
const probabilities = { prospecting: 10, qualification: 25, discovery: 40, proposal: 60, negotiation: 75, legal_review: 90, closed_won: 100, closed_lost: 0 };

function stringList(value, name) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw new InputError(`${name} must contain 1-20 values`);
  return value.map((entry, index) => text(entry, `${name}[${index}]`, { min: 2, max: 120 }));
}

function validateCriteria(toStage, value) {
  const criteria = object(value, 'criteria');
  switch (toStage) {
    case 'qualification': return {
      business_problem: text(criteria.business_problem, 'criteria.business_problem', { min: 10, max: 1000 }),
      buyer_owner: text(criteria.buyer_owner, 'criteria.buyer_owner', { min: 2, max: 200 }),
    };
    case 'discovery': return {
      discovery_summary: text(criteria.discovery_summary, 'criteria.discovery_summary', { min: 20, max: 3000 }),
      stakeholders: stringList(criteria.stakeholders, 'criteria.stakeholders'),
    };
    case 'proposal': return {
      proposal_reference: text(criteria.proposal_reference, 'criteria.proposal_reference', { min: 5, max: 500 }),
      solution_fit: text(criteria.solution_fit, 'criteria.solution_fit', { min: 10, max: 2000 }),
    };
    case 'negotiation':
      if (criteria.commercial_range_confirmed !== true) throw new InputError('criteria.commercial_range_confirmed must be true');
      return {
        buyer_feedback: text(criteria.buyer_feedback, 'criteria.buyer_feedback', { min: 10, max: 2000 }),
        commercial_range_confirmed: true,
      };
    case 'legal_review': return {
      security_owner: text(criteria.security_owner, 'criteria.security_owner', { min: 2, max: 200 }),
      legal_owner: text(criteria.legal_owner, 'criteria.legal_owner', { min: 2, max: 200 }),
    };
    case 'closed_won': return {
      signed_contract_reference: text(criteria.signed_contract_reference, 'criteria.signed_contract_reference', { min: 8, max: 500 }),
      approved_arr_usd: decimal(criteria.approved_arr_usd, 'criteria.approved_arr_usd', { min: 0.01 }),
    };
    case 'closed_lost': return {
      loss_reason: text(criteria.loss_reason, 'criteria.loss_reason', { min: 10, max: 2000 }),
    };
    default: throw new InputError('Unsupported target stage');
  }
}

function validateTransition(fromStage, toStage, role, criteria) {
  if (!nextStages[fromStage]?.includes(toStage)) throw new InputError(`Transition from ${fromStage} to ${toStage} is not allowed`, 409, 'INVALID_STAGE_TRANSITION');
  if (toStage === 'closed_won' && role !== 'admin') throw new InputError('Only an administrator can record a won contract', 403, 'ROLE_REQUIRED');
  return validateCriteria(toStage, criteria);
}

module.exports = { STAGES, nextStages, probabilities, validateCriteria, validateTransition };
