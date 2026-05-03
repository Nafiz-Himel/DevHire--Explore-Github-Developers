                    {linkedInUrl && (
                      <a
                        href={linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-item"
                        title={linkedInUrl}
                      >
                        <span role="img" aria-label="linkedin">💼</span> <span className="contact-text">{linkedInUrl.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}