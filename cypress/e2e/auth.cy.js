describe('Authentication Flow', () => {
  it('should redirect to login when accessing dashboard unauthenticated', () => {
    cy.visit('/dashboard');
    // We expect it to redirect to login
    cy.url().should('include', '/login');
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.contains('button', 'Login').should('exist');
  });
});
